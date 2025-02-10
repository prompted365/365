// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: magic;
// YearlyProgressTracker_HTML_Responsive.js
// This widget displays a dynamic, responsive grid of dots representing each day of the current year.
// Past days (including today) are white, future days are dim gray, and (optionally) special days are blue.
// A footer shows the current year (left) and remaining days (right) with padded, drop-shadowed text.

// ----- BONUS: Toggle a "special" day via widget parameter -----
// Usage (when run interactively): Pass a parameter like "special:NN" (with NN = day-of-year) to toggle that day's state.
if (args.widgetParameter) {
  let param = args.widgetParameter.trim();
  if (param.startsWith("special:")) {
    let specialToggleDay = parseInt(param.split(":")[1]);
    if (!isNaN(specialToggleDay)) {
      let specialDays = [];
      try {
        let stored = Scriptable.getSetting("specialDays");
        if (stored) specialDays = JSON.parse(stored);
      } catch (e) {
        specialDays = [];
      }
      if (specialDays.includes(specialToggleDay)) {
        specialDays = specialDays.filter(d => d !== specialToggleDay);
      } else {
        specialDays.push(specialToggleDay);
      }
      Scriptable.setSetting("specialDays", JSON.stringify(specialDays));
    }
  }
}

(async function() {
  // ----- Date Calculations -----
  let now = new Date();
  let year = now.getFullYear();
  let startOfYear = new Date(year, 0, 1);
  let dayOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
  let isLeap = ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0));
  let totalDays = isLeap ? 366 : 365;
  let daysLeft = totalDays - dayOfYear;

  // ----- Load stored special days (if any) -----
  let specialDays = [];
  try {
    let stored = Scriptable.getSetting("specialDays");
    if (stored) specialDays = JSON.parse(stored);
  } catch (e) {
    specialDays = [];
  }

  // ----- Generate the grid HTML -----
  // Each dot is generated as a div. Colors are:
  // • Blue for special days, white for days up to (and including) today, gray for future days.
  let dotsHtml = "";
  for (let i = 1; i <= totalDays; i++) {
    let color;
    if (specialDays.includes(i)) {
      color = "#0000FF"; // blue
    } else if (i <= dayOfYear) {
      color = "#FFFFFF"; // past/today: white
    } else {
      color = "#555555"; // future: dim gray
    }
    dotsHtml += `<div class="dot" style="background-color: ${color};" data-color="${color}"></div>`;
  }

  // ----- Build the full HTML string with responsive, padded layout and drop shadows -----
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      background: #000;
      color: #fff;
      font-family: 'Helvetica Neue', sans-serif;
    }
    /* The grid uses 20 evenly spaced columns, with a dynamic gap and padding */
    #grid {
      display: grid;
      grid-template-columns: repeat(20, 1fr);
      grid-gap: 8px;
      padding: 16px;
    }
    /* Each grid cell centers its dot (sized at 70% of the cell) with a drop shadow for depth */
    .dot {
      width: 70%;
      aspect-ratio: 1;
      border-radius: 50%;
      margin: auto;
      box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.5);
      transition: background-color 0.2s;
    }
    /* Footer with padded, drop-shadowed text for aesthetics */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      font-size: 16px;
      font-family: monospace;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
    }
  </style>
</head>
<body>
  <div id="grid">
    ${dotsHtml}
  </div>
  <div class="footer">
    <div id="year">${year}</div>
    <div id="countdown">${daysLeft} days left</div>
  </div>
  <script>
    // (Optional interactivity:) In non-widget mode, dots are clickable to toggle blue special state.
    document.querySelectorAll('.dot').forEach(function(dot) {
      dot.addEventListener('click', function() {
        if (dot.style.backgroundColor !== 'blue') {
          dot.style.backgroundColor = 'blue';
        } else {
          dot.style.backgroundColor = dot.getAttribute('data-color');
        }
      });
    });
  </script>
</body>
</html>
  `;

  // ----- Render the HTML in a WebView and output accordingly -----
  if (config.runsInWidget) {
    // In widget mode, load the HTML in a WebView, take a snapshot, and use that image.
    let webView = new WebView();
    await webView.loadHTML(html);
    // Allow a brief moment for the HTML to render before taking a snapshot.
    await new Promise(resolve => setTimeout(resolve, 150));
    let snapshot = await webView.takeSnapshot();
    
    let widget = new ListWidget();
    widget.backgroundColor = new Color("#000000");
    let imgElement = widget.addImage(snapshot);
    imgElement.centerAlignImage();
    Script.setWidget(widget);
    Script.complete();
  } else {
    // When running interactively, present the full, interactive web view.
    await WebView.loadHTML(html, null, new Size(0, 300));
    Script.complete();
  }
})();