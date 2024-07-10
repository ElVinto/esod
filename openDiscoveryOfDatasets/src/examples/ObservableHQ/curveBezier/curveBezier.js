// To use with D3:
link = d3
  .link(curves.curveBezierX)
  .x((d) => d.y)
  .y((d) => d.x)

  curves = {
    function Bezier(context, vertical) {
      this._context = context;
      this._vertical = vertical;
    }
  
    Bezier.prototype = {
      areaStart: function () {
        this._line = 0;
      },
      areaEnd: function () {
        this._line = NaN;
      },
      lineStart: function () {
        this._x = this._y = NaN;
        this._point = 0;
      },
      lineEnd: function () {
        if (this._point === 2) this._context.lineTo(this._x, this._y);
        if (this._line || (this._line !== 0 && this._point === 1))
          this._context.closePath();
        if (this._line >= 0) this._line = 1 - this._line;
      },
      point: function (x, y) {
        (x = +x), (y = +y);
        switch (this._point) {
          case 0:
            this._point = 1;
            this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
            break;
          case 1:
            this._point = 2; // falls through
          default: {
            if (this._vertical)
              this._context.bezierCurveTo(this._x, y, x, this._y, x, y);
            else this._context.bezierCurveTo(x, this._y, this._x, y, x, y);
            break;
          }
        }
        (this._x = x), (this._y = y);
      }
    };
  
    return {
      curveBezierX: function (context) {
        return new Bezier(context, false);
      },
      curveBezierY: function (context) {
        return new Bezier(context, true);
      }
    };
  }