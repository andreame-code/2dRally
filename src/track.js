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

  addSegment(segments, 0, 40);
  addSegment(segments, 0.0012, 60);
  addSegment(segments, 0, 30);
  addSegment(segments, -0.0015, 85);
  addSegment(segments, 0, 20);
  addSegment(segments, 0.0018, 70);
  addSegment(segments, -0.001, 50);
  addSegment(segments, 0, 60);

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
