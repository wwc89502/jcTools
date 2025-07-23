export const foods = [
  // public
  { name: '煮鸡蛋', cal: 142, size: 2, unit: '个' },
  // 早餐
  { name: '生姜', cal: 14, size: 30, unit: 'g' },
  { name: '纯牛奶', cal: 105, size: 250, unit: 'ml' },
  { name: '酸牛奶', cal: 105, size: 250, unit: 'ml' },
  { name: '猕猴桃', cal: 62, size: 1, unit: '个' },
  { name: '西柚', cal: 62, size: 1, unit: '个' },
  // 午餐 empty
  { name: '蒸米饭', cal: 232, size: 200, unit: 'g' },
  // 晚餐
  { name: '蒸土豆', cal: 138, size: 200, unit: 'g' },
  { name: '荞麦面A', cal: 138, size: 200, unit: 'g' },
  { name: '荞麦面B', cal: 138, size: 200, unit: 'g' },
  { name: '荞麦面C', cal: 138, size: 200, unit: 'g' },
  { name: '酱牛肉', cal: 89, size: 36, unit: 'g' },
  { name: '生蚝', cal: 89, size: 36, unit: 'g' },
]

export const userFoods = [
  {
    userId: 1,
    batch: JSON.stringify([
      { "name": "早餐", "group": [ { "key": [ 1 ] }, { "key": [ 2 ] }, { "key": [ 3, 4 ] }, { "key": [ 5, 6 ] } ] },
      { "name": "午餐", "group": [ { "key": [ 7 ] } ] },
      { "name": "晚餐", "group": [ { "key": [ 1 ] }, { "key": [ 8, 9, 10, 11 ] }, { "key": [ 12, 13 ] } ] }
    ])
  }
]
