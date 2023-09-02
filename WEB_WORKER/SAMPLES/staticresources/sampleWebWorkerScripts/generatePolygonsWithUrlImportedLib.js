importScripts('https://unpkg.com/@turf/turf@6/turf.min.js');

const generate = () => {
    let polygon = turf.randomPolygon(10, {num_vertices: 5000,});
    console.log('Polygon: ', polygon);
    postMessage(polygon);
}