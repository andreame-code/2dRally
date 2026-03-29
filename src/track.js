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

  // Stage-style rally track with varied terrain
  addSegment(segments, 0, 25);           // straight start
  addSegment(segments, 0.0006, 20);      // gentle right
  addSegment(segments, 0.0014, 35);      // medium right
  addSegment(segments, 0, 12);           // short straight
  addSegment(segments, -0.0020, 30);     // sharp left hairpin
  addSegment(segments, -0.0008, 20);     // easing left
  addSegment(segments, 0, 18);           // straight
  addSegment(segments, 0.0018, 25);      // sharp right
  addSegment(segments, 0.0004, 15);      // gentle right
  addSegment(segments, 0, 10);           // short straight
  addSegment(segments, -0.0015, 40);     // long left sweeper
  addSegment(segments, 0, 20);           // straight
  addSegment(segments, 0.0010, 30);      // medium right
  addSegment(segments, -0.0006, 25);     // gentle left
  addSegment(segments, 0, 15);           // straight
  addSegment(segments, -0.0022, 20);     // very sharp left
  addSegment(segments, 0, 8);            // short straight
  addSegment(segments, 0.0012, 35);      // medium right sweeper
  addSegment(segments, 0, 22);           // straight
  addSegment(segments, -0.0010, 30);     // medium left
  addSegment(segments, 0.0016, 25);      // sharp right
  addSegment(segments, 0, 30);           // long finish straight

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

// Returns pace note info for upcoming curves
export function getPaceNotes(track, cameraZ, lookAhead) {
  const notes = [];
  const startIdx = segmentIndexAtZ(track, cameraZ);
  let accumCurve = 0;
  let noteStart = -1;
  let noteCurve = 0;

  for (let n = 5; n < lookAhead; n += 1) {
    const idx = (startIdx + n) % track.segments.length;
    const seg = track.segments[idx];

    if (Math.abs(seg.curve) > 0.0003) {
      if (noteStart < 0) {
        noteStart = n;
        noteCurve = 0;
      }
      noteCurve += seg.curve;
      accumCurve = noteCurve;
    } else if (noteStart >= 0) {
      const severity = Math.min(6, Math.max(1, Math.round(Math.abs(accumCurve) * 3200)));
      notes.push({
        distance: noteStart,
        direction: accumCurve < 0 ? 'left' : 'right',
        severity,
      });
      noteStart = -1;
      accumCurve = 0;
      if (notes.length >= 2) break;
    }
  }

  if (noteStart >= 0 && notes.length < 2) {
    const severity = Math.min(6, Math.max(1, Math.round(Math.abs(accumCurve) * 3200)));
    notes.push({
      distance: noteStart,
      direction: accumCurve < 0 ? 'left' : 'right',
      severity,
    });
  }

  return notes;
}
