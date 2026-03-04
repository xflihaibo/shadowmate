/**
 * 伴影 · 互动语句库（诗句 / 冷知识 / 温暖话）
 * 按日期与次数动态轮换，保证每次打开都有变化。
 * 支持传入 locale 的 interaction 对象以做多语言。
 */

export type InteractionMessages = {
  poetry: string[]
  coldKnowledge: string[]
  warmMorning: string[]
  warmNoon: string[]
  warmAfternoon: string[]
  warmEvening: string[]
  warmNight: string[]
  weekdayNames: string[]
  overLimit: string[]
}

function getDailyIndex(seed: string, arrayLength: number): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash) % arrayLength
}

// 诗句（古诗词 / 现代短句，50 条）
export const POETRY = [
  '春眠不觉晓，处处闻啼鸟。',
  '采菊东篱下，悠然见南山。',
  '行到水穷处，坐看云起时。',
  '山中何事？松花酿酒，春水煎茶。',
  '晚来天欲雪，能饮一杯无？',
  '人闲桂花落，夜静春山空。',
  '明月松间照，清泉石上流。',
  '草在结它的种子，风在摇它的叶子。',
  '你一会儿看云，一会儿看我。',
  '从前的日色变得慢，车、马、邮件都慢。',
  '黑夜给了我黑色的眼睛，我却用它寻找光明。',
  '面朝大海，春暖花开。',
  '愿你有情人终成眷属，愿你在尘世获得幸福。',
  '今夜我不关心人类，我只想你。',
  '活在这珍贵的人间，太阳强烈，水波温柔。',
  '要有最朴素的生活和最遥远的梦想。',
  '岁月不饶人，我亦未曾饶过岁月。',
  '世间所有的相遇，都是久别重逢。',
  '山河远阔，人间烟火。',
  '愿你一生努力，一生被爱。',
  '此中有真意，欲辨已忘言。',
  '人生如逆旅，我亦是行人。',
  '醉后不知天在水，满船清梦压星河。',
  '小楼一夜听春雨，深巷明朝卖杏花。',
  '若无闲事挂心头，便是人间好时节。',
  '我见青山多妩媚，料青山见我应如是。',
  '落霞与孤鹜齐飞，秋水共长天一色。',
  '竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。',
  '山有木兮木有枝，心悦君兮君不知。',
  '海上生明月，天涯共此时。',
  '君问归期未有期，巴山夜雨涨秋池。',
  '春风得意马蹄疾，一日看尽长安花。',
  '欲买桂花同载酒，终不似，少年游。',
  '世间好物不坚牢，彩云易散琉璃脆。',
  '你本无意穿堂风，偏偏孤倨引山洪。',
  '我们终将迷失在大雾中，互相遗忘。',
  '我有一瓢酒，可以慰风尘。',
  '人间有味是清欢。',
  '明月几时有？把酒问青天。',
  '但愿人长久，千里共婵娟。',
  '人生到处知何似，应似飞鸿踏雪泥。',
  '拣尽寒枝不肯栖，寂寞沙洲冷。',
  '试问岭南应不好，却道：此心安处是吾乡。',
  '且将新火试新茶，诗酒趁年华。',
  '休对故人思故国，且将新火试新茶。',
  '春水碧于天，画船听雨眠。',
  '当时明月在，曾照彩云归。',
  '今人不见古时月，今月曾经照古人。',
  '浮云一别后，流水十年间。',
  '相看两不厌，只有敬亭山。',
]

// 冷知识 / 趣味小知识（50 条）
export const COLD_KNOWLEDGE = [
  '蜂蜜不会变质，考古学家在古埃及墓里发现过仍可食用的蜂蜜。',
  '香蕉是浆果，草莓不是浆果。',
  '云朵看起来轻飘飘的，一团积云平均约重 500 吨。',
  '章鱼有三颗心脏，血液是蓝色的。',
  '人的一生大约会走 20 万公里，相当于绕地球 5 圈。',
  '打哈欠会传染，甚至看到“打哈欠”三个字也可能想打。',
  '企鹅可以跳起一米多高，方便从水里跳上冰面。',
  '一天中人的身高会变化，早上比晚上高约 1～2 厘米。',
  '蜜蜂的翅膀每秒可扇动约 200 次。',
  '北极熊的皮肤是黑色的，毛是透明中空的。',
  '长颈鹿的舌头能伸到约 45 厘米，用来卷树叶。',
  '蜗牛可以睡三年。',
  '海獭睡觉时会手拉手，防止漂散。',
  '考拉指纹与人类非常相似，有时会混淆。',
  '树懒一周只下树排便一次。',
  '火烈鸟的粉色来自它们吃的藻类和虾。',
  '猫头鹰的眼球不能转动，所以会转头 270 度。',
  '人的大脑约 75% 是水。',
  '光从太阳到地球大约需要 8 分 20 秒。',
  '一朵云平均含有约 100 万升水。',
  '蚂蚁从不睡觉，但会每天打两次约 8 分钟的盹。',
  '大象能通过脚掌感知地下数十公里外的震动。',
  '金鱼的记忆其实可以长达数月，不只几秒。',
  '袋鼠不会向后跳，只能向前或向两侧。',
  '水母没有心脏、大脑和骨骼。',
  '鲨鱼比人类早存在约 4 亿年。',
  '蝴蝶用脚品尝味道。',
  '鳄鱼的大脑只有约 5 个奥利奥那么大。',
  '鸽子能认出自己的照片，是少数能通过镜像测试的鸟类之一。',
  '海星没有血液，用海水在体内循环。',
  '人的一生会脱落约 18 公斤皮肤。',
  '指甲生长速度大约是脚趾甲的 4 倍。',
  '人一生中平均会做约 10 万次梦。',
  '心脏每天泵出的血液约 7600 升。',
  '人眼可以区分约 1000 万种颜色。',
  '打喷嚏时气流速度可达约 160 公里/小时。',
  '人一生会产生约 2.5 万升唾液。',
  '骨头比钢铁还坚固，同重量下承重能力更强。',
  '人睡着时嗅觉几乎关闭，所以闻不到烟味容易危险。',
  '地球上的树木数量约是银河系恒星数量的 30 倍。',
  '月球正在以每年约 3.8 厘米的速度远离地球。',
  '闪电的温度约为太阳表面温度的 5 倍。',
  '钻石在高温下可以燃烧。',
  '冰有十几种不同的晶体结构。',
  '珠穆朗玛峰不是离地心最远的山，赤道的钦博拉索峰才是。',
  '地球上约 71% 是海洋，人类已探索的不到 5%。',
  '一天并非正好 24 小时，地球自转在变慢。',
  '香蕉含有微量放射性同位素钾-40，但完全安全。',
  '人的头发单根可承重约 100 克，整头头发能吊起约两辆小汽车。',
]

// 温暖话（50 条，按时段分池，保证提示与当前时间匹配）
// 温暖话文案不含固定周几，展示时前缀【周X】由当前日期动态生成，避免错乱
const WARM_MORNING = [
  '早上好呀，新的一天要对自己好一点。',
  '早安，今天也要温柔地开始。',
  '早，慢慢来，比较快。',
  '早上好，记得喝杯水再开工。',
  '早呀，今天也一起吧。',
  '早上好，伴影在呢。',
  '早呀，记得眨眼看看远处。',
  '早安，你值得被温柔对待。',
  '早安，今天也要好好吃饭呀。',
  '早呀，伴影陪你开始这一天。',
]
const WARM_NOON = [
  '午安，歇一歇再继续。',
  '中午好，记得好好吃饭。',
  '午安呀，下午也要加油。',
  '中午好，伴影在呢。',
  '午安，吃饱才有力气。',
  '今天伴影陪你。',
  '喝口水吧，身体会记得。',
  '午安呀，伸个懒腰再继续。',
  '中午好，今天也很努力呢。',
  '午安，累了就歇一歇。',
]
const WARM_AFTERNOON = [
  '下午好，专注的时候时间过得很快。',
  '下午呀，再坚持一下。',
  '下午好，伴影陪你。',
  '下午呀，喝口水再继续。',
  '下午好，今天也很努力呢。',
  '下午呀，每一步都算数。',
  '下午好，你比想象中更厉害。',
  '下午好，伴影一直在。',
  '下午呀，歇一歇再继续。',
  '下午好，慢慢来，比较快。',
]
const WARM_EVENING = [
  '傍晚好，离归航不远了。',
  '傍晚呀，辛苦了一天。',
  '傍晚好，该收尾啦。',
  '傍晚呀，伴影在呢。',
  '傍晚好，晚上记得休息。',
  '傍晚好，今天的小小坚持会变成明天的底气。',
  '傍晚呀，此刻的你已经很好了。',
  '傍晚好，偶尔摸鱼也没关系。',
  '傍晚呀，明天又是新的一天。',
  '傍晚好，再坚持一下就好。',
]
const WARM_NIGHT = [
  '夜深了，早点休息呀。',
  '晚安，今天辛苦了。',
  '夜深呀，别熬太晚。',
  '晚安，明天再一起。',
  '夜深了，伴影陪你到最后。',
  '晚安，今天先到这里吧。',
  '夜深了，伴影静默守护中。',
  '晚安呀，好好休息。',
  '夜深了，做点喜欢的事再睡吧。',
  '晚安，明天又是新的一天。',
]

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function getWarmPool(hour: number): string[] {
  if (hour >= 5 && hour < 12) return WARM_MORNING
  if (hour >= 12 && hour < 15) return WARM_NOON
  if (hour >= 15 && hour < 18) return WARM_AFTERNOON
  if (hour >= 18 && hour < 22) return WARM_EVENING
  return WARM_NIGHT
}

// 超限提示（每日互动超过 10 次时随机展示）
export const OVER_LIMIT_MESSAGES = [
  '你要好好工作啦～伴影也要歇一歇，明天再陪你玩 ✨',
  '我也是有脾气的，不能一直陪你玩耍呀～明天见 👻',
  '你今日陪玩次数已经用完啦，明日再来吧 ✨',
  '伴影累了，要去充电啦～明天同一时间，不见不散 👻',
  '今天互动够多啦，留点时间给工作和休息吧～',
  '明日再来找伴影玩呀，今天先好好干活 👻',
  '次数用完啦～伴影静默守护中，明天再和你说话 ✨',
  '今天已经说了好多啦，剩下的明天再说吧～',
]

export type InteractionType = 'poetry' | 'cold' | 'warm'

function getWarmPoolFromInteraction(hour: number, interaction: InteractionMessages): string[] {
  if (hour >= 5 && hour < 12) return interaction.warmMorning
  if (hour >= 12 && hour < 15) return interaction.warmNoon
  if (hour >= 15 && hour < 18) return interaction.warmAfternoon
  if (hour >= 18 && hour < 22) return interaction.warmEvening
  return interaction.warmNight
}

export function getInteractionContent(
  seedBase: string,
  interaction?: InteractionMessages
): { type: InteractionType; text: string } {
  const poetry = interaction?.poetry ?? POETRY
  const coldKnowledge = interaction?.coldKnowledge ?? COLD_KNOWLEDGE
  const typeIndex = getDailyIndex(seedBase, 3)
  const types: InteractionType[] = ['poetry', 'cold', 'warm']
  const type = types[typeIndex]

  if (type === 'poetry') {
    const text = poetry[getDailyIndex(seedBase + 'p', poetry.length)]
    return { type: 'poetry', text }
  }
  if (type === 'cold') {
    const text = coldKnowledge[getDailyIndex(seedBase + 'c', coldKnowledge.length)]
    return { type: 'cold', text }
  }
  const now = new Date()
  const weekday = now.getDay()
  const hour = now.getHours()
  const pool = interaction ? getWarmPoolFromInteraction(hour, interaction) : getWarmPool(hour)
  const weekdayNames = interaction?.weekdayNames ?? WEEKDAY_NAMES
  const seed = seedBase + 'w' + weekday + hour
  const text = pool[getDailyIndex(seed, pool.length)]
  const dayName = weekdayNames[weekday]
  return { type: 'warm', text: `【${dayName}】${text}` }
}

export function getOverLimitMessage(seed: string, interaction?: { overLimit: string[] }): string {
  const list = interaction?.overLimit ?? OVER_LIMIT_MESSAGES
  return list[getDailyIndex(seed, list.length)]
}
