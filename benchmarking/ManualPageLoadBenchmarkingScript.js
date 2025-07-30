(function() {
  'use strict';

  function measurePerformance() {
      setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0];
          const timing = performance.timing;

          if (!perfData) {
              console.warn('Navigation timing data not available');
              return;
          }

          const metrics = {
              networkTime: (perfData.responseEnd - perfData.fetchStart).toFixed(2),
              ttfb: (perfData.responseStart - perfData.fetchStart).toFixed(2),
              domProcessing: (timing.domComplete - timing.domLoading).toFixed(2),

              totalLoadTime: (perfData.loadEventEnd - perfData.fetchStart).toFixed(2),
              domContentLoaded: (perfData.domContentLoadedEventEnd - perfData.fetchStart).toFixed(2),
              resourceLoadTime: (perfData.loadEventStart - perfData.domContentLoadedEventEnd).toFixed(2),

              domInteractive: (perfData.domInteractive - perfData.fetchStart).toFixed(2),
              firstPaint: 'N/A', // Will be populated if available
              firstContentfulPaint: 'N/A' // Will be populated if available
          };


          const paintEntries = performance.getEntriesByType('paint');
          paintEntries.forEach(entry => {
              if (entry.name === 'first-paint') {
                  metrics.firstPaint = entry.startTime.toFixed(2);
              }
              if (entry.name === 'first-contentful-paint') {
                  metrics.firstContentfulPaint = entry.startTime.toFixed(2);
              }
          });

          console.group('🚀 Page Load Performance Metrics');
          console.table(metrics);
          console.log('URL:', window.location.href);
          console.log('Timestamp:', new Date().toISOString());
          console.groupEnd();

          window.performanceResults = {
              url: window.location.href,
              timestamp: new Date().toISOString(),
              metrics: metrics
          };

      }, 1000);
  }

  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', measurePerformance);
      window.addEventListener('load', measurePerformance);
  } else {
      measurePerformance();
  }
})();
