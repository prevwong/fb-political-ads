import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Layout, Button, Tag } from 'element-react'
import * as d3 from 'd3'
import "d3-selection-multi";


export const Clustering = () => {
    const width = 960, height = 500;
    const svgRef = useRef();
    const clusters = 8
    const [data, setData] = useState(null);
    const [sidebarData, setSidebarData] = useState('Select a node to view');
    const [cluster, setCluster] = useState({})
    const [activeClass, setActiveClass] = useState(null)
    const [activeLabel, setActiveLabel] = useState(null)
    const [reload, toggleReload] = useState(false)
    let Colors = {};
    let points = []

    Colors.names = {
        aqua: "#00ffff",
        // azure: "#f0ffff",
        beige: "#f5f5dc",
        // black: "#000000",
        blue: "#0000ff",
        brown: "#a52a2a",
        cyan: "#00ffff",
        darkblue: "#00008b",
        darkcyan: "#008b8b",
        darkgrey: "#a9a9a9",
        darkgreen: "#006400",
        darkkhaki: "#bdb76b",
        darkmagenta: "#8b008b",
        darkolivegreen: "#556b2f",
        darkorange: "#ff8c00",
        darkorchid: "#9932cc",
        darkred: "#8b0000",
        darksalmon: "#e9967a",
        darkviolet: "#9400d3",
        fuchsia: "#ff00ff",
        gold: "#ffd700",
        green: "#008000",
        indigo: "#4b0082",
        khaki: "#f0e68c",
        lightblue: "#add8e6",
        lightcyan: "#e0ffff",
        lightgreen: "#90ee90",
        lightgrey: "#d3d3d3",
        lightpink: "#ffb6c1",
        lightyellow: "#ffffe0",
        lime: "#00ff00",
        magenta: "#ff00ff",
        maroon: "#800000",
        navy: "#000080",
        olive: "#808000",
        orange: "#ffa500",
        pink: "#ffc0cb",
        purple: "#800080",
        violet: "#800080",
        red: "#ff0000",
        silver: "#c0c0c0",
        // white: "#ffffff",
        yellow: "#ffff00"
    };
    Colors.random = function () {
        var result;
        var count = 0;
        for (var prop in this.names)
            if (Math.random() < 1 / ++count)
                result = prop;
        return result;
    };


    function handleMouseOut(d, i) {
        const svg = d3.select(svgRef.current)

        // Use D3 to select element, change color back to normal
        svg.selectAll("circle").style('opacity', 1)

        d3.select(this).attrs({
            r: 2
        });
        setActiveClass(null)
        setSidebarData('')
        setActiveLabel(null)

        // Select text by id and then remove
        // d3.select("#t" + d.x + "-" + d.y + "-" + i).remove();  // Remove text location
    }

    function handleMouseOver(d, i) {
        const svg = d3.select(svgRef.current)

        svg.selectAll("circle").style('opacity', 0.2)
        d3.select(this).attrs({
            r: 10
        }).styles({ 'opacity': 1 })
        setSidebarData(`Title: ${points[i].title}, Cluster ${parseInt(points[i].label) + 1}`)
        setActiveClass(points[i].color)
        setActiveLabel(points[i].label)
        // setInfo(points[i] && `${points[i].title} ${points[i].color}`, points[i] && points[i].message)

    }

    function generatePolygonPoints(numPoints) {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = height / 3;

        const points = d3.range(numPoints)
            .map(i => {
                const angle = i / numPoints * Math.PI * 2 + Math.PI;
                return {
                    x: Math.sin(angle) * radius + centerX,
                    y: Math.cos(angle) * radius + centerY
                };
            });
        return points
    }

    function animate(circle, data) {
        // console.log(data)
        return new Promise((resolve, reject) => {
            circle.transition()
                .duration(2000)
                .attr("cx", function (d, i) {
                    // console.log(i)
                    return (data[i] && data[i].x) || 0;
                })
                .attr("cy", function (d, i) {
                    return (data[i] && data[i].y) || 0;
                })
                .attr('entities', function (d, i) { return data[i] && data[i].entity || [] })
                .style('fill', function (d, i) {
                    return data[i] && data[i].color || 'transparent'
                })
                // .attr('color', function (d, i) { return data[i].color || 'black' })
                .on('end', () => {
                    resolve()
                })
        })

    }

    const draw = useCallback(async () => {
        
        if (!data) return
        const svg = d3.select(svgRef.current)
        svg.html('')

        const frames = []
        const length = data.labels.length

        // Firstly, init x points at center
        for (let i = 0; i < length; i++) {
            points.push({
                id: i,
                x: width / 2,
                y: height / 2,
            })
        }

        frames.push(points)
        const circle = svg.selectAll("circle")
            .data(frames[0])
            .enter()
            .append("circle")
            .attr("cx", function (d) {
                return d.x; // new data field
            })
            .attr("cy", function (d) {
                return d.y; // new data field
            })
            .attr("r", 2)
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut);
        points = []
        // Then, space them out accordingly. 
        for (let i = 0; i < length; i++) {
            points.push({
                id: i,
                x: Math.random() * width,
                y: Math.random() * height,
            })
        }
        frames.push(points)
        await animate(circle, frames[1])

        // const clusters = 5
        // const iteration = 2
        const polyPoints = generatePolygonPoints(clusters)
        const colorList = {}

        // for (let i = 1; i <= iteration; i++) {
        points = []
        let labelling = {}
        const rSize = {}
        const { labels, entities, distances, titles, messages } = data
        // Segregate current clusters into labels
        for (let k = 0; k < labels.length; k++) {
            const curLabel = labels[k]
            if (labelling[curLabel]) {
                labelling[curLabel].push(k)
            } else {
                labelling[curLabel] = [k]
            }
        }

        for (let k = 0; k < clusters; k++) {
            rSize[k] = Math.floor(Math.sqrt(2 * 2 * labelling[k].length / Math.PI))
        }

        // (Pi R2 / 2 * no of dots) = 2*2*no / pi
        let maxEntityList = {}
        for (let k = 0; k < clusters; k++) {
            maxEntityList[k] = {}
        }

        entities.map((entityList, index) => {
            const label = labels[index]
            const thisEntities = JSON.parse(entityList).map(entity => {
                return entity['entity']
            })
            for (const entity of thisEntities) {
                if (maxEntityList[label][entity]) {
                    maxEntityList[label][entity] += 1
                } else {
                    maxEntityList[label][entity] = 1
                }
            }
        })

        for (let k = 0; k < clusters; k++) {
            var sortable = [];
            for (const entity in maxEntityList[k]) {
                sortable.push([entity, maxEntityList[k][entity]])
            }
            sortable.sort(function (a, b) {
                return b[1] - a[1];
            });
            maxEntityList[k] = [...sortable]
        }

        const maxEntitiesMentioned = {}
        const maxEntityInfo = {}
        for (let k = 0; k < clusters; k++) {
            maxEntitiesMentioned[k] = maxEntityList[k].splice(0, 3)
            maxEntityInfo[k] = {}
            const entities = maxEntitiesMentioned[k].map(entity => entity[0])
            const entitiesFreq = maxEntitiesMentioned[k].map(entity => entity[1])
            entities.forEach((entity, i) => {
                if (!colorList[entity]) {
                    let color = Colors.random()
                    while (Object.values(colorList).includes(color)) {
                        color = Colors.random()
                    }
                    colorList[entity] = color
                    // generateNewRowForInfo(`${entity} - ${colorList[entity]}`, colorList[entity])
                }
                maxEntityInfo[k][entity] = {
                    color: colorList[entity],
                    freq: entitiesFreq[i]
                }
            })
            // maxEntitiesMentioned.push(...maxEntityList[k].splice(0, 1))
        }
        setCluster(maxEntityInfo)

        const minDist = Math.min(...distances.flat(Infinity))
        const maxDist = Math.max(...distances.flat(Infinity))
        let j = 0;
        // R -= intervalMinusR
        for (const label of labels) {
            const entityList = entities[j]
            const thisEntities = JSON.parse(entityList).map(entity => {
                return entity['entity']
            })
            const titleList = maxEntitiesMentioned[label].map(entity => entity[0])
            const intersection = titleList.filter(value => -1 !== thisEntities.indexOf(value))
            // console.log(label, intersection)
            let color = 'black'
            if (intersection.length > 0) {
                color = colorList[intersection[0]] // Only take the max
            }
            const R = rSize[label]
            const centroid = polyPoints[label]
            let a = Math.random() * 2 * Math.PI;// angle
            let r = Math.sqrt(~~(Math.random() * R * R));// distance fron the center of the main circle
            // x and y coordinates of the particle
            let x = centroid.x + r * Math.cos(a);
            let y = centroid.y + r * Math.sin(a);
            points.push({
                id: j,
                x,
                y,
                label,
                color,
                centroid,
                entity: entities[j],
                title: titles[j],
                message: messages[j],
            })
            j++
        }
        // console.log(points)
        frames.push(points)
        await animate(circle, frames[frames.length - 1])
    }, [data])
    // }



    const init = useCallback(async () => {
        const loaded = await d3.json(
            `datasets/clustering.json`
        )
        console.log(loaded)
        setData(loaded)
    })

    useEffect(() => {
        init()
    }, [])

    useEffect(() => {
        draw()

    }, [data])

    useEffect(() => {
        if (reload) {
            draw()
            toggleReload(false)
        }
    }, [reload])




    return (
        <div>
            <Layout.Row>

                <Layout.Col span="18">
                    <Button onClick={() => toggleReload(true)} style={{ 'margin': '10px 20px' }}>Restart Cool Animation</Button>
                    <svg
                        ref={svgRef}
                        preserveAspectRatio='xMinYMin meet'
                        viewBox={`0 0 ${width} ${height}`}
                    ></svg>

                </Layout.Col>
                <Layout.Col span="6" style={{ 'overflow': 'scroll', 'maxHeight': height+'px' }}>
                    <h4>Info Pane</h4>
                    {sidebarData}
                    {Object.entries(cluster).map(([key, info]) => {
                        return (
                            <div key={key}>
                                <h5 style={{
                                    'textDecoration':
                                        (!activeLabel ? 'none' : activeLabel == key ? 'underline' : 'none')
                                }}>Cluster {parseInt(key) + 1}</h5>
                                {
                                    Object.entries(info).map(([entity, obj]) => {
                                        return <Tag style={{
                                            opacity:
                                                (!activeClass || activeClass === obj.color ? 1 : 0.2)
                                        }} key={entity} color={obj.color}>
                                            {entity} - {obj.freq}
                                        </Tag>
                                    })
                                }
                            </div>
                        )
                    })}
                </Layout.Col>
            </Layout.Row>

        </div>
    )

}
