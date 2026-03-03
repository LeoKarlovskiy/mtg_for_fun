export type SlotConfig = {
  rotation: 0 | 90 | 180 | 270
  gridArea: string
}

export type OrientationDef = {
  id: string
  label: string
  playerCount: number
  gridStyle: {
    gridTemplateAreas: string
    gridTemplateColumns: string
    gridTemplateRows: string
  }
  slots: SlotConfig[]
}

export const ORIENTATIONS: OrientationDef[] = [
  // ── 2 players ──────────────────────────────────────────────────
  {
    id: '2-top-bottom',
    label: 'Top / Bottom',
    playerCount: 2,
    gridStyle: {
      gridTemplateAreas: '"p2" "p1"',
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr 1fr',
    },
    slots: [
      { rotation: 0,   gridArea: 'p1' },
      { rotation: 180, gridArea: 'p2' },
    ],
  },
  {
    id: '2-left-right',
    label: 'Left / Right',
    playerCount: 2,
    gridStyle: {
      gridTemplateAreas: '"p1 p2"',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr',
    },
    slots: [
      { rotation: 270, gridArea: 'p1' },
      { rotation: 90,  gridArea: 'p2' },
    ],
  },

  // ── 3 players ──────────────────────────────────────────────────
  {
    id: '3-2top-1bottom',
    label: '2 top · 1 bottom',
    playerCount: 3,
    gridStyle: {
      gridTemplateAreas: '"p2 p3" "p1 p1"',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
    },
    slots: [
      { rotation: 0,   gridArea: 'p1' },
      { rotation: 180, gridArea: 'p2' },
      { rotation: 180, gridArea: 'p3' },
    ],
  },
  {
    id: '3-1side',
    label: '1 bottom · 1 top · 1 side',
    playerCount: 3,
    gridStyle: {
      gridTemplateAreas: '"p3 p2" "p3 p1"',
      gridTemplateColumns: '1fr 2fr',
      gridTemplateRows: '1fr 1fr',
    },
    slots: [
      { rotation: 0,   gridArea: 'p1' },
      { rotation: 180, gridArea: 'p2' },
      { rotation: 270, gridArea: 'p3' },
    ],
  },

  // ── 4 players ──────────────────────────────────────────────────
  {
    id: '4-2x2',
    label: '2 + 2',
    playerCount: 4,
    gridStyle: {
      gridTemplateAreas: '"p3 p4" "p1 p2"',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
    },
    slots: [
      { rotation: 0,   gridArea: 'p1' },
      { rotation: 0,   gridArea: 'p2' },
      { rotation: 180, gridArea: 'p3' },
      { rotation: 180, gridArea: 'p4' },
    ],
  },
  {
    id: '4-compass',
    label: 'Compass',
    playerCount: 4,
    gridStyle: {
      gridTemplateAreas: '". p3 ." "p2 . p4" ". p1 ."',
      gridTemplateColumns: '1fr 2fr 1fr',
      gridTemplateRows: '1fr 2fr 1fr',
    },
    slots: [
      { rotation: 0,   gridArea: 'p1' },
      { rotation: 270, gridArea: 'p2' },
      { rotation: 180, gridArea: 'p3' },
      { rotation: 90,  gridArea: 'p4' },
    ],
  },

  // ── 5 players ──────────────────────────────────────────────────
  {
    id: '5-2plus2plus-side',
    label: '2 + 2 + side',
    playerCount: 5,
    gridStyle: {
      gridTemplateAreas: '"p3 p4 p5" "p1 p2 p5"',
      gridTemplateColumns: '1fr 1fr 1fr',
      gridTemplateRows: '1fr 1fr',
    },
    slots: [
      { rotation: 0,   gridArea: 'p1' },
      { rotation: 0,   gridArea: 'p2' },
      { rotation: 180, gridArea: 'p3' },
      { rotation: 180, gridArea: 'p4' },
      { rotation: 90,  gridArea: 'p5' },
    ],
  },
  {
    id: '5-3plus2',
    label: '3 top · 2 bottom',
    playerCount: 5,
    gridStyle: {
      gridTemplateAreas: '"p3 p3 p4 p4 p5 p5" "p1 p1 p1 p2 p2 p2"',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gridTemplateRows: '1fr 1fr',
    },
    slots: [
      { rotation: 0,   gridArea: 'p1' },
      { rotation: 0,   gridArea: 'p2' },
      { rotation: 180, gridArea: 'p3' },
      { rotation: 180, gridArea: 'p4' },
      { rotation: 180, gridArea: 'p5' },
    ],
  },

  // ── 6 players ──────────────────────────────────────────────────
  {
    id: '6-3plus3',
    label: '3 + 3',
    playerCount: 6,
    gridStyle: {
      gridTemplateAreas: '"p4 p5 p6" "p1 p2 p3"',
      gridTemplateColumns: '1fr 1fr 1fr',
      gridTemplateRows: '1fr 1fr',
    },
    slots: [
      { rotation: 0,   gridArea: 'p1' },
      { rotation: 0,   gridArea: 'p2' },
      { rotation: 0,   gridArea: 'p3' },
      { rotation: 180, gridArea: 'p4' },
      { rotation: 180, gridArea: 'p5' },
      { rotation: 180, gridArea: 'p6' },
    ],
  },
  {
    id: '6-2plus2plus-sides',
    label: '2 + 2 + sides',
    playerCount: 6,
    gridStyle: {
      gridTemplateAreas: '". p4 p5 ." "p3 . . p6" ". p1 p2 ."',
      gridTemplateColumns: '1fr 2fr 2fr 1fr',
      gridTemplateRows: '1fr 2fr 1fr',
    },
    slots: [
      { rotation: 0,   gridArea: 'p1' },
      { rotation: 0,   gridArea: 'p2' },
      { rotation: 270, gridArea: 'p3' },
      { rotation: 180, gridArea: 'p4' },
      { rotation: 180, gridArea: 'p5' },
      { rotation: 90,  gridArea: 'p6' },
    ],
  },
]

export function getOrientationsForCount(count: number): OrientationDef[] {
  return ORIENTATIONS.filter(o => o.playerCount === count)
}

export function getOrientation(id: string): OrientationDef | undefined {
  return ORIENTATIONS.find(o => o.id === id)
}

export function defaultOrientation(count: number): OrientationDef {
  return getOrientationsForCount(count)[0]
}
