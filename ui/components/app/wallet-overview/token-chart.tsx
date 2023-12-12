// import React, { useEffect, useState } from 'react';
// import { Line } from 'react-chartjs-2';
// import {
//   Chart,
//   TimeScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   ScriptableContext,
//   Filler,
//   Tooltip,
// } from 'chart.js';
// import 'chartjs-adapter-moment';
// import { Token } from '@metamask/assets-controllers';
// import CrosshairPlugin from 'chartjs-plugin-crosshair';
// import {
//   ButtonSecondary,
//   ButtonSecondarySize,
// } from '../../component-library';

// // https://price-api.metafi.codefi.network/v1/chains/1/spot-prices/0xae7ab96520de3a18e5e111b5eaab095312d7fe84?vsCurrency=usd
// // https://price-api.metafi.codefi.network/v1/chains/1/historical-prices-graph/0xae7ab96520de3a18e5e111b5eaab095312d7fe84
// // This one doesnt have all the buckets and maybe we need to request separately ^^

// const TokenChart = ({ token }: { token: Token }) => {

//   const [timeRange, setTimeRange] = useState("1D");
//   const [prices, setPrices] = useState<any>(); // todo better type

//   // todo for big time ranges do we need to reduce number of data points client side?

//   useEffect(() => {
//     fetch(
//       `https://price-api.metafi.codefi.network/v1/chains/1/historical-prices/${token.address}?vsCurrency=usd&timePeriod=${timeRange}`,
//     )
//       .then((data) => data.json())
//       .then((data) => setPrices(data.prices));
//   }, [timeRange]);

//   if (!prices) return <></>

//   const data = {
//     labels: prices.map((item: any) => new Date(item[0])),
//     datasets: [
//       {
//         label: token.symbol,
//         data: prices.map((item: any) => item[1]),
//         borderColor: '#28A745',
//         elements: {
//           line: {
//             borderWidth: 2,
//           },
//           point: {
//             pointStyle: false,
//           },
//         },
//         fill: true,
//         backgroundColor: (context: ScriptableContext<'line'>) => {
//           const gradient = context.chart.ctx.createLinearGradient(
//             0,
//             0,
//             0,
//             context.chart.height,
//           );
//           gradient.addColorStop(0, 'rgba(40, 167, 69, 0.30)');
//           gradient.addColorStop(1, 'rgba(217, 217, 217, 0.00)');
//           return gradient;
//         },
//       },
//     ],
//   };

//   const options = {
//     scales: {
//       x: {
//         display: false,
//         type: 'time',
//         // time: { unit: 'minute' }, // todo is this right for all scales?
//         grid: { display: false },
//       },
//       y: {
//         display: false,
//         grid: { display: false },
//       },
//     },
//     onHover: (e: any) => {
//       console.log(e);
//     },
//     plugins: {
//       tooltip: {
//         mode: 'index',
//         intersect: false,
//         backgroundColor: '#EBEBEB',
//         titleColor: '#24272A',
//         bodyColor: '#24272A',
//         yAlign: 'bottom',
//         caretPadding: 10000,
//         // caretSize: 0
//       },
//       crosshair: {
//         line: {
//           color: '#BBC0C5',
//           width: 2,
//         },
//       },
//     },
//   } as const; // or can const individual fields if necesary?

//   Chart.register(
//     TimeScale,
//     LinearScale,
//     PointElement,
//     LineElement,
//     Filler,
//     Tooltip,
//     CrosshairPlugin,
//   );

//   return (
//     <>
//       <Line data={data} options={options} />
//       <ButtonSecondary onClick={() => setTimeRange("1D")} size={ButtonSecondarySize.Sm}>1D</ButtonSecondary>
//       <ButtonSecondary onClick={() => setTimeRange("7D")} size={ButtonSecondarySize.Sm}>1W</ButtonSecondary>
//       <ButtonSecondary onClick={() => setTimeRange("1M")} size={ButtonSecondarySize.Sm}>1M</ButtonSecondary>
//       <ButtonSecondary onClick={() => setTimeRange("3M")} size={ButtonSecondarySize.Sm}>3M</ButtonSecondary>
//       <ButtonSecondary onClick={() => setTimeRange("1Y")} size={ButtonSecondarySize.Sm}>1Y</ButtonSecondary>
//       <ButtonSecondary onClick={() => setTimeRange("5Y")} size={ButtonSecondarySize.Sm}>5Y</ButtonSecondary>
//       <ButtonSecondary size={ButtonSecondarySize.Sm}>ALL</ButtonSecondary>
//     </>
//   );
// };

// export default TokenChart;
