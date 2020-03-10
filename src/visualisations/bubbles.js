
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Layout, Select, Button, Loading } from 'element-react'
import * as d3 from 'd3'
import "d3-selection-multi";
import constants from '../utils/constants'

export const Bubbles = () => {
    const width = 960, height = 500;
    const maxBubbles = 150;
    const svgRef = useRef();
    const minBubbleSize = 5
    const maxBubbleSize = 80
    const velocityDecay = 0.15;
    const forceStrength = 0.03;
    const { overviewType } = constants;
    const [selectedView, selectView] = useState();
    const [viewData, selectData] = useState({});
    const [sidebarData, setSidebarData] = useState('Select a node to view');
    const [nested, toggleNested] = useState(false);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    let forceSimulation, bubbles, text;


    function handleMouseOver(d, i) {

        d3.select(this).attrs({
            r: d.radius * 1.5
        });

        setSidebarData(`${d.data}: ${d.freq}`)
        const svg = d3.select(svgRef.current)
        svg.selectAll("circle").style('opacity', function (d1) {
            return d1.data == d.data ? 1 : 0.2;
        })
        svg.selectAll("text").style('opacity', function (d1) {
            return d1.data == d.data ? 1 : 0.2;
        })

    }

    function handleMouseOut(d, i) {
        d3.select(this).attrs({
            r: d.radius,
        });
        const svg = d3.select(svgRef.current)
        svg.selectAll("circle").style('opacity', 1)
        svg.selectAll("text").style('opacity', 1)

    }

    function handleMouseClick(d) {
        if (nested) return
        const result = {}
        let category, selector;
        if (selectedView === overviewType.ENTITIES || selectedView === overviewType.TARGETS) {
            if (selectedView === overviewType.ENTITIES) {
                category = 'entity_type'
                selector = 'entity'
            } else if (selectedView === overviewType.TARGETS) {
                category = 'target'
                selector = 'segment'

            }
            data[selectedView].forEach(entitiesObj => {
                const entitiesList = JSON.parse(entitiesObj)
                entitiesList.forEach(entity => {
                    if (entity[category] !== d.data) return

                    if (result[entity[selector]]) {
                        result[entity[selector]] += 1
                    } else {
                        result[entity[selector]] = 1
                    }
                })
            })
            toggleNested(true)
            prepareInnerData(result)

        }

    }

    function dragged(d) {
        /* bubbles.attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y); */
        d.fx = d3.event.x
        d.fy = d3.event.y
    }

    function dragStarted(d) {
        forceSimulation.alphaTarget(0.3).restart()
    }

    function dragEnded(d) {
        delete d.fx;
        delete d.fy;
        forceSimulation.alphaTarget(0);
    }

    function ticked() {
        bubbles
            .attr("cx", function (d) {
                return d.x;
            })
            .attr("cy", function (d) {
                return d.y;
            });
        text
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
    }

    function charge(d) {
        return -Math.pow(d.radius, 2) * forceStrength;
    }

    function ticked() {
        bubbles
            .attr("cx", function (d) {
                return d.x;
            })
            .attr("cy", function (d) {
                return d.y;
            });
        text
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
    }

    const init = useCallback(async () => {
        const loaded = await d3.json(
            `datasets/overview.json`
        )
        setLoading(false)
        setData(loaded)
    })

    const draw = useCallback(async () => {

        const svg = d3.select(svgRef.current)
        let radiusScale;
        let colorScale;
        let heightScale;

        const allFrequencies = Object.values(viewData)
        const minFrequency = Math.min(...allFrequencies)
        const maxFrequency = Math.max(...allFrequencies)


        radiusScale = d3.scaleLinear()
            .domain([minFrequency, maxFrequency])
            .range([minBubbleSize, maxBubbleSize]);

        colorScale = d3.scaleSequential()
            .domain([minFrequency, maxFrequency])
            .interpolator(d3.interpolateRainbow);

        heightScale = d3.scaleLinear()
            .domain([minFrequency, maxFrequency])
            .range([0, height]);

        const nodes = Object.keys(viewData).map(d => {

            return {
                data: d,
                freq: viewData[d],
                radius: radiusScale(viewData[d]),
                fill: colorScale(viewData[d]),
                x: Math.random() * width,
                y: heightScale(viewData[d])/*  Math.random() * height */
            }
        })

        // d3.select("#chart").html("")
        // d3.select('#chart')
        //     .append('svg')
        //     .attr('height', height)
        //     .attr('width', width)
        svg.html("")
        bubbles = svg
            .selectAll('circle')
            .data(nodes)
            .enter()
            .append('circle')
            .attr('r', d => { return d.radius })
            .attr('fill', d => nested? 'lightblue' : 'salmon')
            .attr('stroke', d => nested? d3.rgb('lightblue').darker() : d3.rgb('salmon').darker())
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut)
            .on('click', handleMouseClick)
            .call(d3.drag()
                .on('start', dragStarted)
                .on('drag', dragged)
                .on('end', dragEnded)
            )

        text = svg
            .selectAll('text')
            .data(nodes.filter(node => node.radius > 20))
            .enter()
            .append('text')
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('font-size', '10px')
            .attr("transform", d => `translate(-${d.radius / 2}, 0)`)
            .text((d) => d.data)


        forceSimulation = d3.forceSimulation()
            .nodes(nodes)
            .velocityDecay(velocityDecay)
            .on('tick', ticked)
            .force('x', d3.forceX().strength(forceStrength).x(width / 2))
            .force('y', d3.forceY().strength(forceStrength).y(height / 2))
            .force("charge", d3.forceManyBody().strength(charge))

    }, [viewData, nested])

    const prepareInnerData = (result) => {
        const finalResult = {}
        const keysSorted = Object.keys(result).sort(function (a, b) { return result[b] - result[a] })
        keysSorted.splice(0, maxBubbles).forEach(key => {
            finalResult[key] = result[key]
        })
        selectData(finalResult)

    }


    const prepareOuterData = (key) => {
        console.log(data)
        if (!data) return
        const result = {}
        const finalResult = {}
        // Prepare data for visualization
        const selectedData = data[key]
        // console.log(data, key, selectedData)

        switch (key) {
            case 'entities':
                selectedData.forEach(entitiesObj => {
                    const entitiesList = JSON.parse(entitiesObj)
                    entitiesList.forEach(entity => {
                        if (result[entity['entity_type']]) {
                            result[entity['entity_type']] += 1
                        } else {
                            result[entity['entity_type']] = 1
                        }
                    })
                })
                break;
            case 'targets':
                selectedData.forEach(targetsObj => {
                    const targetsList = JSON.parse(targetsObj)
                    targetsList.forEach(target => {
                        if (result[target['target']]) {
                            result[target['target']] += 1
                        } else {
                            result[target['target']] = 1
                        }
                    })
                })
                break;
            case 'advertiser':
            case 'paid_for_by':
                selectedData.forEach(data => {
                    if (result[data]) {
                        result[data] += 1
                    } else {
                        result[data] = 1
                    }
                })
                break;


        }

        const keysSorted = Object.keys(result).sort(function (a, b) { return result[b] - result[a] })
        keysSorted.splice(0, maxBubbles).forEach(key => {
            finalResult[key] = result[key]
        })

        selectData(finalResult)
    }

    useEffect(() => {
        draw()
    }, [viewData])

    useEffect(() => {
        prepareOuterData(selectedView)
        toggleNested(false)
    }, [selectedView])

    useEffect(() => {
        if (!nested) {
            prepareOuterData(selectedView)
        }
    }, [nested])

    useEffect(() => {
        init()
    }, [])



    return (
        <div>
            <Layout.Row>
                <Layout.Col offset="1" style={{ marginTop: '10px' }}>
                    <Select onChange={(value) => { selectView(value) }} placeholder="Choose one">
                        {
                            Object.values(overviewType).map(key => {
                                return <Select.Option key={key} label={key} value={key}>
                                </Select.Option>
                            })
                        }
                    </Select>
                </Layout.Col>

                <Layout.Col span="18">
                    {
                        loading ? <Loading>
                            
                        </Loading> : <svg
                            ref={svgRef}
                            preserveAspectRatio='xMinYMin meet'
                            viewBox={`0 0 ${width} ${height}`}
                        ></svg>
                    }

                </Layout.Col>
                <Layout.Col span="6">
                    <h4>Info Pane</h4>
                    {sidebarData}
                    <br></br>
                    {nested ? <Button style={{ 'marginTop': '10px' }} type="primary" onClick={() => toggleNested(false)}>Back to {selectedView}</Button> : null}
                </Layout.Col>
            </Layout.Row>

        </div>
    )

}