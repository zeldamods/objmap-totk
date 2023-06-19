import * as L from 'leaflet';

export interface CanvasMarkerOptions extends L.CircleMarkerOptions {
  icon?: HTMLImageElement;
  iconWidth?: number;
  iconHeight?: number;
  showLabel?: boolean;
  badge?: boolean;
}

export class CanvasMarker extends L.CircleMarker {
  options!: CanvasMarkerOptions;

  _updatePath() {
    if (!this.options.icon) {
      // @ts-ignore
      super._updatePath();
    } else {
      // @ts-ignore
      this._renderer._botwDrawCanvasImageMarker(this);
    }
    this._drawBadges();
  }
  _updateBounds() {
    if (this.options.icon) {
      // @ts-ignore
      return super._updateBounds();
    }
    // @ts-ignore
    const r = this._radius * 3,
      // @ts-ignore
      r2 = this._radiusY || r,
      // @ts-ignore
      w = this._clickTolerance(),
      p = [r + w, r2 + w];
    // @ts-ignore
    this._pxBounds = new L.Bounds(this._point.subtract(p), this._point.add(p));
  }
  setBadge(badge: boolean) {
    this.options.badge = badge;
  }
  _drawBadges() {
    if (!this.options.badge) {
      return;
    }
    const badge = {
      offset: 10,
      radius: 5,
      stroke: true,
      color: "goldenrod",
      weight: 0.8,
      fill: true,
      fillColor: '#645838',
      fillOpacity: 1,
      checkmark: {
        weight: 1.8,
        color: "goldenrod",
        lineCap: 'round',
        lineJoin: 'round',
        fill: false,
        stroke: true,
      },
    };
    // @ts-ignore
    const renderer = this._renderer;
    const ctx = renderer._ctx;
    // @ts-ignore
    const pt = this._point;
    const p = { x: pt.x, y: pt.y };
    p.x += badge.offset;
    p.y -= badge.offset;
    // Circle
    ctx.beginPath();
    ctx.arc(p.x, p.y, badge.radius, 0, Math.PI * 2, true);
    renderer._fillStroke(ctx, { options: badge });
    // Checkmark
    const s = badge.radius / 3;
    p.x += 1;
    ctx.beginPath();
    ctx.moveTo(p.x + s, p.y - s);
    ctx.lineTo(p.x - s, p.y + s);
    ctx.lineTo(p.x - s - s, p.y);
    renderer._fillStroke(ctx, { options: badge.checkmark });
  }
}
