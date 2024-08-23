// @ts-expect-error suppress CommonJS vs ECMAScript error
import { Chart, Point, ChartEvent } from 'chart.js';

type CrosshairChart = Chart & { crosshairX?: number };

/** A Chart.js plugin that draws a vertical crosshair on hover */
export const CrosshairPlugin = {
  id: 'crosshair',
  afterEvent(chart: CrosshairChart, { event }: { event: ChartEvent }) {
    chart.crosshairX =
      event.type === 'mouseout' ? undefined : event.x ?? undefined;
    chart.draw();
  },
  afterDraw(chart: CrosshairChart) {
    if (chart.crosshairX !== undefined) {
      const data = chart.data.datasets[0].data as Point[];
      const index = Math.max(
        0,
        Math.min(
          data.length - 1,
          Math.round((chart.crosshairX / chart.width) * data.length),
        ),
      );

      const point = data[index];
      if (point) {
        const { x: xAxis, y: yAxis } = chart.scales;
        const x = xAxis.getPixelForValue(point.x);
        const y = yAxis.getPixelForValue(point.y);

        chart.ctx.lineWidth = 1;
        chart.ctx.strokeStyle = '#BBC0C5';
        chart.ctx.beginPath();
        chart.ctx.moveTo(x, 0);
        chart.ctx.lineTo(x, chart.height);
        chart.ctx.stroke();

        chart.ctx.beginPath();
        chart.ctx.arc(x, y, 3, 0, 2 * Math.PI);
        chart.ctx.fillStyle = chart.options.borderColor as string;
        chart.ctx.fill();
      }
    }
  },
};
