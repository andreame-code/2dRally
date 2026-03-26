const SEGMENT_LENGTH = 30;
const ROAD_HALF_WIDTH = 1;

function addSegment(segments, curve, count, palette = 0) {
  for (let i = 0; i < count; i += 1) {
    segments.push({
      curve,
      colorIndex: (segments.length + palette) % 2,
      sprites: [],
    });
  }
}

export function createTrack() {
  const segments = [];

  addSegment(segments, 0, 30);
  addSegment(segments, 0.0009, 40);
  addSegment(segments, 0.0015, 30);
  addSegment(segments, 0.0005, 25);
  addSegment(segments, 0, 15);
  addSegment(segments, -0.0012, 55);
  addSegment(segments, -0.0018, 25);
  addSegment(segments, 0, 20);
  addSegment(segments, 0.0013, 45);
  addSegment(segments, -0.001, 35);
  addSegment(segments, 0.0007, 30);
  addSegment(segments, 0, 25);

  return {
    segments,
    segmentLength: SEGMENT_LENGTH,
    roadHalfWidth: ROAD_HALF_WIDTH,
    length: segments.length * SEGMENT_LENGTH,
  };
}

export function segmentIndexAtZ(track, z) {
  return Math.floor(z / track.segmentLength) % track.segments.length;
}

export function wrapZ(track, z) {
  let value = z % track.length;
  if (value < 0) value += track.length;
  return value;
}
