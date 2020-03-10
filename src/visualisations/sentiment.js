import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Layout, Dialog, Tabs, Table, Tag } from 'element-react'
import * as d3 from 'd3'
import { Legends } from '../components/Legends'
import { capitalise } from '../utils'


// console.log(fc.chartCartesian)
export const Sentiment = () => {
  const svgRef = useRef()
  const svgD3 = useRef();
  const colorRef = useRef()
  const [dialog, setDialog] = useState();
  const [legends, setLegends] = useState();
  const [selected, setSelected] = useState();
  
  const selectedRef = useRef();
  selectedRef.current = selected;

  let w = 900,
    h = 400

  const init = useCallback(async () => {
    var svg = d3.select(svgRef.current)
    svgD3.current = svg

    const margin = { top: 20, right: 20, bottom: 30, left: 100 }
    const width = w - margin.left - margin.right
    const height = h - margin.top - margin.bottom
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    var y = d3
      .scaleBand() // x = d3.scaleBand()
      .rangeRound([0, height]) // .rangeRound([0, width])
      .paddingInner(0.05)
      .align(0.1)

    var x = d3
      .scaleLinear() // y = d3.scaleLinear()
      .rangeRound([0, width]) // .rangeRound([height, 0]);

    
    const highlightRegion = function(d) {
      if ( !d.selectable ) return;

      svg.selectAll("rect").style('opacity', function(d1) {
        return d1 == d ? 1: 0.2;
      })

  
      div
        .transition()
        .duration(200)
        .style('opacity', 0.9)
      div
        .html(
          `
          <div>${capitalise(d.key)}: ${d[1] - d[0]}</div>
        `
        )
        .style('left', d3.event.pageX + 'px')
        .style('top', d3.event.pageY - 28 + 'px')
    };
    
    const unhighlightRegion = function() {
      svg.selectAll("rect").style('opacity', _  => 1)

      div
        .transition()
        .duration(500)
        .style('opacity', 0)
    }

    svg.unhighlightRegion = unhighlightRegion;


    const json = await d3.json('datasets/categorisedSentimentFinal.json')
    const keys = ['entity', 'neutral', 'mixed', 'positive', 'negative']

    

    const csv = Object.keys(json).reduce((accum, key) => {
      const message = json[key]
      const data = {
        entity: key,
        ...keys.slice(1).reduce((accum, key) => {
          const relevant = message.filter(msg => msg.conclusion == key)
          accum[key] = relevant.length
          return accum
        }, {})
      }

      accum.push(data)
      return accum
    }, [])

    console.log(csv);
    y.domain(
      csv.map(function (d) {
        return d.entity
      })
    )

    x.domain([0, 100]).nice()

    const series = d3.stack().keys(keys.slice(1))(csv);

    var color = d3
      .scaleOrdinal()
      .range(['#62bedc', '#6b8ae4', '#1fa888', '#fec958']);

    setLegends(keys.slice(1).map(name => ({ name: capitalise(name), color: color(name) })))
    colorRef.current = color;

    var div = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)

    g.append('g')
      .selectAll('g')
      .data(series)
      .enter()
      .append('g')
      .attr('fill', function (d) {
        return color(d.key)
      })
      .selectAll('rect')
      .data(function (d) {
        d.map((i, o) => {
          i.key = d.key;
          i.index = o;
          return i;
        });
        return d
      })
      .enter()
      .append('rect')
      .style('transition', '0.1s ease-in')
      .attr('y', function (d) {
        d.selectable = true;
        return y(d.data.entity)
      })
      .attr('x', function (d, i) {
        return x(d[0])
      }) 
      .attr('width', function (d) {
        return x(d[1]) - x(d[0])
      })
      .attr('height', y.bandwidth())
      .style("cursor", "pointer")
      .on('mouseover', function (d) {
        highlightRegion(d);
      })
      .on('mouseout', function (d) {
        unhighlightRegion();
      })
      .on('mousedown', d => {
        const obj = {
          selected: d,
          data: json[d.data.entity],
          keys: keys.slice(1),
        };

        setDialog(obj)
      })

    g.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0,0)')
      .call(d3.axisLeft(y))

    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x));
  }, [])

  useEffect(() => {
    init()
  }, [])

  return (
    <div style={{padding: "20px 0"}}>
       <Dialog
        title={dialog && dialog.selected.data.entity}
        visible={!!dialog}
        onCancel={ () => setDialog(null) }
      >
        <Dialog.Body>
          {
            dialog ? (
              <Tabs activeName={dialog.selected.key} value={dialog.selected.key}>
                {
                  dialog.keys.map(key => {
                    const table = {
                      columns: [
                        {
                          label: "Message",
                          prop: "message",
                        },
                        {
                          label: "Impressions",
                          prop: "impressions",
                          width: 120
                        }
                      ],
                      data: dialog.data.filter(item => item.conclusion == key).reduce((accum, item) => {
                          accum.push({
                            message: item.text,
                            impressions: item.impressions
                          })
                          return accum;
                        }, [])
                      
                    }
                    return (
                      <Tabs.Pane 
                       label={<>{capitalise(key)} <Tag style={{background: colorRef.current(key)}}>{dialog.selected.data[key]}</Tag></>}
                       name={key} key={key}>
                        <Table
                         height={250}
                          style={{width: '100%'}}
                          columns={table.columns}
                          data={table.data}
                        />
                      </Tabs.Pane>
                    )
                  })
                }
              </Tabs>
            ) : null
          }
        </Dialog.Body>
      </Dialog>
      <Layout.Row>
        <Layout.Col span='20'>
          <svg
            ref={svgRef}
            preserveAspectRatio='xMinYMin meet'
            viewBox={`0 0 ${w} ${h}`}
          ></svg>
        </Layout.Col>
        <Layout.Col span="4">
          <div className="toolbar">
            <section>
              <h3>Legends</h3>
              {legends ? (
                <Legends
                  data={legends}
                  onChange={(value) => {
                    value = value ? value.toLowerCase() : value;
                    const svg = svgD3.current

                    svg.selectAll('rect').each(function (d) {
                      const category = d.key;
                      if ( value && category != value) {
                        this.style.fill = '#eee';
                        d.selectable = false;
                      }
                      else {
                        this.style.fill = colorRef.current(category);
                        d.selectable = true;
                      }
                    })
                  }}
                />
              ) : null}
            </section>
          </div>
        </Layout.Col>
      </Layout.Row>
    </div>
  )
}
