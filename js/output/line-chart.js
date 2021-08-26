document.addEventListener('DOMContentLoaded', function() {

  document.querySelectorAll('nav button').forEach(button => {
    button.addEventListener('click', function(e) {
      var el = e.target,
          actionDetail = el.getAttribute('class');
          action = el.parentElement.getAttribute('class');
      if (navActions && navActions[action]) {
        navActions[action](actionDetail);
        return;
      }

      console.error(`Couldn't find method for: ${action}`)
    });
  });

});

let navActions = {};
navActions.device = function(device) {
  document.querySelector('body').setAttribute('data-device', device);
}


function processDataset(dataset) {
  // loop through urls
  for (const [url, deviceData] of Object.entries(dataset)) {
    for (const [device, data] of Object.entries(deviceData)) {
      let refPoint = data.scores.performance;

      // only generate SVGs when there is more than 1 data point
      if (refPoint && refPoint.length > 1) {
        createSvg(url, device, data.scores.performance);
        generateTable(url, device, data);
        color.domain(Object.keys(data.scores));

        for (const [props, lines] of Object.entries(data)) {
          var dataInput = Object.entries(lines).map(([name, lineInfo]) => {
            return {
              name,
              values: lineInfo,
            };
          });
          drawLineChart(url, device, dataInput);
          // createLegend(url, device, dataInput);
        }
      }
    }
  }
}

let margin = { top: 20, right: 80, bottom: 30, left: 40 };
let height = 350;
let width = 650;

var color = d3.scaleOrdinal(d3.schemeCategory10);

let x, y;

function createSvg(url, device, data) {
  x = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => new Date(d.date)))
    .range([margin.left, width - margin.right]);

  y = d3
    .scaleLinear()
    .domain([d3.min([50, d3.min(data, (d) => d.score)]), 100])
    .nice()
    .range([height - margin.bottom, margin.top]);

  let xAxis = (g) =>
    g.attr('transform', `translate(0,${height - margin.bottom})`).call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

  let yAxis = (g) => {
    return g
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g
          .select('.tick:last-of-type text')
          .clone()
          .attr('x', 3)
          .attr('text-anchor', 'start')
          .attr('font-weight', 'bold')
          .text(data.y)
      );
  };

  const svg = d3
    .create('svg')
    .attr('viewBox', [0, 0, width, height])
    .attr('data-url', url)
    .attr('data-device', device)
    .attr('class', device);
  svg.append('g').call(xAxis);
  svg.append('g').call(yAxis);

  let header = document.createElement('h3');
  header.textContent = `${url} (${device})`;
  // document.getElementById(device).appendChild(header);
  // document.getElementById(device).appendChild(svg.node());
  let newSection = document.createElement('div');
  newSection.setAttribute('class', 'scanUrl')
  newSection.setAttribute('data-url', url)
  newSection.setAttribute('data-device', device)
  newSection.appendChild(header)
  newSection.appendChild(svg.node());

  document.querySelector('main').appendChild(newSection)
}

function createLegend(url, device, data) {
  let svg = d3.select(`svg[data-url="${url}"][data-device="${device}"]`);

  var legend = svg.selectAll('g.legend')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'legend');

    legend.append('rect')
      .attr('x', width - 80)
      .attr('y', function(d, i) {
        return i * 20;
      })
      .attr('width', 10)
      .attr('height', 10)
      .style('fill', function(d) {
        return color(d.name);
      });

    legend.append('text')
      .attr('x', width - 68)
      .attr('y', function(d, i) {
        return (i * 20) + 9;
      })
      .text(function(d) {
        return d.name;
      });
}

Element.prototype.appendElement = function (tag) {
  var element = document.createElement(tag);
  this.appendChild(element);
  return element;
};

var line = d3
  .line()
  .defined((d) => !isNaN(d.score))
  .x((d) => x(new Date(d.date)))
  .y((d) => y(d.score))
  .curve(d3.curveBasis);

function drawLineChart(url, device, dataset) {
  let data = dataset;

  var svg = d3.select(`svg[data-url="${url}"][data-device="${device}"]`);

  var score = svg
    .selectAll('.score')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'score')
    .attr('data-score', name)
    .attr('data-device', device);

  score
    .append('path')
    .attr('class', 'line')
    .style('fill', 'none')
    .attr('d', function (d) {
      return line(d.values);
    })
    .style('stroke', function (d) {
      return color(d.name);
    });

  score
    .append('text')
    .datum(function (d) {
      return {
        name: d.name,
        value: d.values[d.values.length - 1],
      };
    })
    .attr('class', function (d) {
      return ['lineText', d.value.type].join(' ');
    })
    .attr('transform', function (d) {
      return (
        'translate(' + x(new Date(d.value.date)) + ',' + y(d.value.score) + ')'
      );
    })
    .attr('x', 3)
    .attr('dy', '.35em')
    .text(function (d) {
      return d.name;
    });
}


function generateTable(url, device, data) {
  var table = document.createElement('table'),
    thead = table.appendElement('thead'),
    tbody = table.appendElement('tbody');

  var headerRow = thead.appendElement('tr');
  headerRow.appendElement('th'); // spacer

  let headers = applicableIndicesArray(data.scores.performance);
  headers.forEach((item, idx) => {
    let th = headerRow.appendElement('th');
    th.append(new Date(item.date).toLocaleDateString('en-US', {timeZone: 'UTC'}));

    if (idx != 0) {
      th.setAttribute('colspan', 2);
    }
  });

  Object.entries(data).forEach(([nada, types]) => {
    Object.entries(types).forEach(([typeName, scans]) => {
      let contentRow = tbody.appendElement('tr');
      let td = contentRow.appendElement('td');
      td.setAttribute('class', 'typeName');
      td.append(typeName);

      let applicableScans = applicableIndicesArray(scans);

      applicableScans.forEach((scan, idx) => {
        let td = contentRow.appendElement('td');
        td.setAttribute('class', 'scoreCell');
        td.setAttribute('data-score', scan.score);
        td.append(scan.score);

        if (idx != 0) {
          let scoreDiff = scan.score - applicableScans[0].score;
          let tdCompare = contentRow.appendElement('td');
          tdCompare.append(scoreDiff);
          tdCompare.setAttribute('class', scoreDiff < 0 ? 'score-negative' : 'score-positive');
        }

      });

    });
  });

  document.querySelector(`[data-url="${url}"][data-device="${device}"]`).appendChild(table);
}

function applicableIndicesArray(arr) {
  let applicableIndices = [0, arr.length - 2, arr.length - 1];
  return arr.reduce((acc, item, idx) => {
    if (applicableIndices.includes(idx)) {
      acc.push(item)
    }
    return acc;
  }, []);
}
