import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import { Layout, Tag } from 'element-react'
import { Legends } from '../components/Legends'

export const HottestTopics = () => {
  const svgRef = useRef()
  const svgD3 = useRef()
  const colorRef = useRef()

  const [legends, setLegends] = useState();
  const [selected, setSelected] = useState();

  const selectedRef = useRef();
  const width = 960,
    height = 500;

  selectedRef.current = selected;

 

  const init = useCallback(async () => {

    var div = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)

    var svg = d3.select(svgRef.current)
    svgD3.current = svg

    var projection = d3
      .geoAlbersUsa()
      .translate([width / 2, height / 2]) // translate to center of screen
      .scale([1000]) // scale things down so see entire US

    // Define path generator
    var path = d3
      .geoPath() // path generator that will convert GeoJSON to SVG paths
      .projection(projection) // tell path generator to use albersUsa projection


    const highlightRegion = function(d) {
      if ( !d.selectable ) return;
      svg.selectAll("path").style('opacity', function(d1) {
        return d1.properties.name == d.properties.name ? 1 : 0.2;
      })
  
      div
        .transition()
        .duration(200)
        .style('opacity', 0.9)
      div
        .html(
          `
        <div>${d.properties.name}</div>
        `
        )
        .style('left', d3.event.pageX + 'px')
        .style('top', d3.event.pageY - 28 + 'px')
    };
    
    const unhighlightRegion = function() {
      svg.selectAll("path").style('opacity', _  => 1)

      div
        .transition()
        .duration(500)
        .style('opacity', 0)
    }

    svg.unhighlightRegion = unhighlightRegion;

    const data = await d3.json(
      `datasets/state-entities-impressions-classified.json`
    )
    const json = await d3.json('datasets/us-states.json')

    for (let i = 0; i < json.features.length; i++) {
      var jsonState = json.features[i].properties.name

      const categoriesInLocation = data[jsonState]
      if (!categoriesInLocation) continue
      const categoriesInLocationWithSumImpressions = Object.entries(
        categoriesInLocation
      ).map(([key, value]) => {
        const { entities } = value
        const mergedEntities = entities.reduce((accum, {name, impressions}) => {
          name = name.replace("-", "")
          name = name.replace(",", "")
          name = name.replace("`s", "");
          name = name.replace('"', '')
          name = name.trim();

          accum[name] = accum[name] ? accum[name] + parseInt(impressions) : parseInt(impressions);
          return accum;
        }, {});

        const sortedMergedEntities = Object.entries(mergedEntities).sort((a, b) => {
          return ( a[1] > b[1]) ? -1 : 1;
        });

        const totalImpressions = entities.reduce(
          (sum, e) => (sum += parseInt(e.impressions)),
          0
        )
        const split = key.split('/')

        return [
          split[split.length - 1],
          {
            ...value,
            entities: sortedMergedEntities,
            // entities: sortedMergedEntities,
            totalImpressions
          }
        ]
      })

      const sortedCategoriesInLocationWithSumImpressions = categoriesInLocationWithSumImpressions.sort(
        ([key, value], [key1, value1]) => {
          return value.totalImpressions > value1.totalImpressions ? -1 : 1
        }
      )

      const top1 = sortedCategoriesInLocationWithSumImpressions[0]
      json.features[i].properties.category = top1
    }

    const categories = Array.from(
      new Set(
        json.features
          .filter(f => !!f.properties.category)
          .map(f => f.properties.category && f.properties.category[0])
      )
    )

    const color = d3
      .scaleOrdinal()
      .domain(categories)
      .range(d3.schemeSet2)

    colorRef.current = color

    setLegends(categories.map(name => ({ name, color: color(name) })))

    svg
      .selectAll('path')
      .data(json.features)
      .enter()
      .append('path')
      .attr('d', path)
      .style('stroke', '#fff')
      .style('stroke-width', '1')
      .style('cursor', 'pointer')
      .style('transition', '0.1s ease-in')
      .style('fill', function (d) {
        d.selectable = true;
        var value = d.properties.category && d.properties.category[0]
        if (value) {
          return color(value)
        } else {
          return '#fafafa'
        }
      })
      .on('mousedown', function(d) {
        if (selectedRef.current && d.properties.name == selectedRef.current.name ) {
          setSelected(null);
          unhighlightRegion();
         } else {
          setSelected(d.properties);
          highlightRegion(d);
         }
      })
      .on('mouseover', function (d) {
        if ( !!selectedRef.current ) return;
        highlightRegion(d);
      })
      .on('mouseout', function (d) {
        if ( selectedRef.current ) return;
        unhighlightRegion();
      })
  }, [])

  useEffect(() => {
    // if ( svg.current ) {
    // console.log(svg.current)
    init()
    // }
  }, [])

  return (
    <div>
      <Layout.Row>
        <Layout.Col span='17'>
          <svg
            preserveAspectRatio='xMinYMin meet'
            viewBox={`0 0 ${width} ${height}`}
            ref={svgRef}
          ></svg>
        </Layout.Col>
        <Layout.Col span='7' style={{position: "relative"}}>
          <div className='toolbar'>
            <section>
              <h3>Legends</h3>
              {legends ? (
                <Legends
                  data={legends}
                  onChange={value => {
                    const svg = svgD3.current

                    svg.selectAll('svg path').each(function (d) {
                      const category =
                        d.properties.category && d.properties.category[0]
                      if (value && category != value) {
                        this.style.fill = '#eee';
                        d.selectable=false;
                      } else {
                        d.selectable=true;
                        this.style.fill = colorRef.current(category);
                      }
                    })
                  }}
                />
              ) : null}
            </section>
          </div>
          {
            selected ? (
              <div className="toolbar overlay" style={{overflow: "auto"}}>
                <section style={{overflow: "hidden"}}>
                  <h2 style={{marginBottom: 0}}>
                    {selected.name}
                    <i 
                      className="el-icon-close close"
                      onClick={() => {
                        setSelected(null);
                        const svg = svgD3.current
                        svg.unhighlightRegion();
                      }}
                    ></i>
                  </h2>
                  <h3><span className="circle" style={{background: colorRef.current(selected.category[0]) }}></span> {selected.category[0]}</h3>
                  <table style={{overflow: "scroll", borderSpacing: "0px 7px", marginTop: "10px"}}>
                    <thead>
                      <tr>
                        <th align="left" width="300">Entity</th>
                        <th align="right">Imp.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        selected.category[1].entities.map((entity, i) => {
                          return (
                            <tr key={i}>
                              <td style={{fontSize: "12px"}}>{entity[0]}</td>
                              <td style={{fontSize: "12px"}}><Tag type="primary" style={{textAlign:"center", width:"100%", borderRadius: "100px"}}>{entity[1]}</Tag></td>
                            </tr>
                          )
                        })
                      }
                    </tbody>
                  </table>
                </section>
              </div>
            ) : null
          }
        </Layout.Col>
      </Layout.Row>
    </div>
  )
}
