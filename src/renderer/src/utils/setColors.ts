export type Color = {
  name: string
  grade: number
  abletonName: string
}

function clr(name: string, grade: number, abletonName: string): Color {
  return { name, grade, abletonName }
}

const COLOR_1 = clr('red', 9, 'Color 1')
const COLOR_2 = clr('red', 6, 'Color 2')
const COLOR_3 = clr('orange', 9, 'Color 3')
const COLOR_4 = clr('orange', 10, 'Color 4') //tomato
const COLOR_5 = clr('orange', 7, 'Color 5')
const COLOR_6 = clr('orange', 11, 'Color 6')
const COLOR_7 = clr('yellow', 8, 'Color 7')
const COLOR_8 = clr('yellow', 9, 'Color 8')
const COLOR_9 = clr('lime', 8, 'Color 9')
const COLOR_10 = clr('grass', 8, 'Color 10')
const COLOR_11 = clr('grass', 10, 'Color 11')
const COLOR_12 = clr('grass', 11, 'Color 12')
const COLOR_13 = clr('jade', 8, 'Color 13')
const COLOR_14 = clr('teal', 9, 'Color 14')
const COLOR_15 = clr('teal', 10, 'Color 15')
const COLOR_16 = clr('blue', 9, 'Color 16')
const COLOR_17 = clr('blue', 8, 'Color 17')
const COLOR_18 = clr('indigo', 10, 'Color 18')
const COLOR_19 = clr('iris', 6, 'Color 19')
const COLOR_20 = clr('blue', 7, 'Color 20')
const COLOR_21 = clr('iris', 9, 'Color 21')
const COLOR_22 = clr('violet', 10, 'Color 22')
const COLOR_23 = clr('purple', 10, 'Color 23')
const COLOR_24 = clr('plum', 10, 'Color 24')
const COLOR_25 = clr('crimson', 9, 'Color 25')
const COLOR_26 = clr('pink', 10, 'Color 26')

export const COLORS = [
  COLOR_1,
  COLOR_2,
  COLOR_3,
  COLOR_4,
  COLOR_5,
  COLOR_6,
  COLOR_7,
  COLOR_8,
  COLOR_9,
  COLOR_10,
  COLOR_11,
  COLOR_12,
  COLOR_13,
  COLOR_14,
  COLOR_15,
  COLOR_16,
  COLOR_17,
  COLOR_18,
  COLOR_19,
  COLOR_20,
  COLOR_21,
  COLOR_22,
  COLOR_23,
  COLOR_24,
  COLOR_25,
  COLOR_26
]

export function getColorForColorIndex(colorIndex: number): Color {
  return COLORS[colorIndex % COLORS.length]
}

export function getColorIndexForColor(color: Color): number {
  return COLORS.findIndex((c) => c.name === color.name)
}
