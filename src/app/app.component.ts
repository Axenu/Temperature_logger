import { Component } from "@angular/core";
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
@Injectable()
export class AppComponent {
  quality = 2;
  lineWidth = 3;
  marginx = 60;
  tipLeft = "0";
  tipTop = "0";
  tipName = "";
  tipTemp = 0;
  title = "app";
  data = [];
  interval: any;
  canvas: HTMLCanvasElement;
  ctx: any;
  dots: any[] = [];
  // colors = ["#C8685F", "#CA7EA9", "#87AADA", "#2ECECB", "#82E28A", "#F7E25B"];
  colors = ["red", "green", "blue", "purple", "black", "orange"];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.canvas = <HTMLCanvasElement>document.getElementById("chart");
    this.canvas.width = this.canvas.clientWidth * this.quality;
    this.canvas.height = this.canvas.clientHeight * this.quality;
    this.ctx = this.canvas.getContext("2d");
    this.loadData();
    this.interval = setInterval(() => {
      this.loadData();
    }, 15000);
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  loadData() {
    this.http
      .post("http://192.168.0.132/Data.php", {
        table: "Hour",
        to: 100,
        from: 0,
        format: "H:i:s"
      })
      .subscribe((data: any) => {
        this.data = data;
        this.drawGraph(data);
      });
  }

  drawGraph(data) {
    var minmax = this.findMinMax(data);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.strokeStyle = "black";
    this.dots = [];
    for (var i = 1; i < data[0].length; i++) {
      this.drawLine(data, this.ctx, i, minmax[0], minmax[1]);
    }
    this.drawHorizontalLines(this.ctx, minmax[0], minmax[1]);
  }

  findMinMax(data) {
    var min = 999;
    var max = -999;
    for (var x = 1; x < data.length; x++) {
      for (var y = 1; y < data[x].length; y++) {
        var v = data[x][y];
        if (v > max) {
          max = v;
        }
        if (v < min) {
          min = v;
        }
      }
    }
    return [min, max];
  }

  drawLine(data, ctx, index, min, max) {
    var stepx = (this.canvas.width - this.marginx) / (data.length - 2);
    var stepy = this.canvas.height / ((max - min) * 1.1);
    var offsety = -min * stepy * 1.1;
    var x = this.marginx;
    var started = false;
    for (var i = 1; i < data.length; i++) {
      if (!started) {
        if (data[i][index]) {
          ctx.beginPath();
          ctx.moveTo(x, this.canvas.height - data[i][index] * stepy - offsety);
          started = true;
          this.dots.push({
            x: x / this.quality,
            y:
              (this.canvas.height - data[i][index] * stepy - offsety) /
              this.quality,
            val: data[i][index],
            index: index
          });
        }
      } else {
        if (!data[i][index]) {
          started = false;
          ctx.strokeStyle = this.colors[index % this.colors.length];
          ctx.lineWidth = this.lineWidth;
          ctx.stroke();
        } else {
          ctx.lineTo(x, this.canvas.height - data[i][index] * stepy - offsety);
          this.dots.push({
            x: x / this.quality,
            y:
              (this.canvas.height - data[i][index] * stepy - offsety) /
              this.quality,
            val: data[i][index],
            index: index
          });
        }
      }
      x += stepx;
    }
    // ctx.closePath();
    ctx.strokeStyle = this.colors[index % this.colors.length];
    ctx.lineWidth = this.lineWidth;
    ctx.stroke();
  }

  drawHorizontalLines(ctx, min, max) {
    // console.log("horizontal lines");
    let dist = 5;
    var mi = Math.ceil((min + 2) / dist);
    var ma = Math.floor(max / dist);
    var stepy = this.canvas.height / ((max - min) * 1.1);
    var offsety = -min * stepy * 1.1;
    for (var i = mi; i <= ma; i++) {
      ctx.beginPath();
      var y = this.canvas.height - i * dist * stepy - offsety;
      ctx.moveTo(this.marginx, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "gray";
      ctx.stroke();

      ctx.fillColor = "black";
      ctx.font = "30px Helvetica";
      ctx.fillText(i * dist, 10, y + 10);
    }
  }

  resize() {
    // Lookup the size the browser is displaying the canvas.
    var displayWidth = this.canvas.clientWidth * this.quality;
    var displayHeight = this.canvas.clientHeight * this.quality;

    // Check if the canvas is not the same size.
    if (
      this.canvas.width != displayWidth ||
      this.canvas.height != displayHeight
    ) {
      // Make the canvas the same size
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      this.drawGraph(this.data);
    }
  }

  mouseMove(e) {
    let offsetX = this.canvas.offsetLeft;
    let offsetY = this.canvas.offsetTop;
    var mouseX = parseInt(e.clientX) - offsetX;
    var mouseY = parseInt(e.clientY) - offsetY;

    // console.log(offsetY);
    // console.log(mouseY);
    // console.log(this.dots);

    // Put your mousemove stuff here
    var closest = 999;
    var hit = false;
    for (var i = 0; i < this.dots.length; i++) {
      var dot = this.dots[i];
      var dx = mouseX - dot.x;
      var dy = mouseY - dot.y;
      var dist = dx * dx + dy * dy;
      if (dist < 50) {
        // tipCanvas.style.left = dot.x + "px";
        // tipCanvas.style.top = dot.y - 40 + "px";
        // tipCtx.clearRect(0, 0, tipCanvas.width, tipCanvas.height);
        // tipCtx.fillText($(dot.tip).val(), 5, 15);
        if (dist < closest) {
          this.tipTop = dot.y + offsetY - 30 + "px";
          this.tipLeft = dot.x + offsetX + "px";
          this.tipName = this.data[0][dot.index];
          this.tipTemp = dot.val;
          closest = dist;
        }
        hit = true;
      }
    }
    if (!hit) {
      // console.log("no hit");
      // tipCanvas.style.left = "-200px";
      this.tipTop = "-400px";
      this.tipLeft = "-400px";
    }
  }
}
