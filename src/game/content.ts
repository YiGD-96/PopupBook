/**
 * The carrot-field survival game (/game): everything it is made of, written from the book's own stories. The farmer guards his field at
 * night with a lantern and a fly swatter (chapter 1), the three shops of chapter 2 are stops on the road where he can eat and power up, and
 * the dishes of chapter 3 are thrown as weapons. The rules follow the survivor-like genre: weapons fire on their own, enemies drop
 * carrots (experience), each level offers a choice of new or stronger weapons and passives, a weapon at its last level (5) evolves with its
 * paired passive when an elite's chest is opened, and coins buy lasting upgrades between runs.
 */

/** The player's stats, multipliers except where noted. */
export type StatKey='might'|'armor'|'maxHp'|'recovery'|'cooldown'|'area'|'speed'|'duration'|'amount'|'moveSpeed'|'magnet'|'luck'|'growth'|'greed'|'revival';
export type Stats=Record<StatKey,number>;
export const BASE_STATS:Stats={might:1,armor:0,maxHp:100,recovery:0,cooldown:1,area:1,speed:1,duration:1,amount:0,moveSpeed:1,magnet:1,luck:1,growth:1,greed:1,revival:0};
export const STAT_LABEL:Record<StatKey,string>={might:'공격력',armor:'방어',maxHp:'최대 체력',recovery:'회복',cooldown:'쿨다운',area:'범위',speed:'투사체 속도',duration:'지속 시간',amount:'투사체 수',moveSpeed:'이동 속도',magnet:'자석',luck:'행운',growth:'성장',greed:'탐욕',revival:'부활'};

/** How long a run lasts (seconds): the king of the swarm comes at the end of it. */
export const RUN_SECONDS=600;
export const MAX_WEAPONS=5,MAX_PASSIVES=5,WEAPON_MAX_LEVEL=5;
/** The paired passive's level a weapon needs (with its last level) to evolve. */
export const EVOLVE_PASSIVE_LEVEL=3;

export type WeaponStats={damage:number;cooldown:number;amount:number;area:number;speed:number;duration:number;pierce:number;knockback:number};
export type WeaponId='swatter'|'rape'|'lantern'|'turbine'|'burger'|'soup'|'kimbap'|'dog'
 |'ghostSwatter'|'blizzardRape'|'moonLantern'|'windFarm'|'burgerSet'|'manoaSoup'|'kimbapStorm'|'dogPack';
export type PassiveId='gloves'|'soil'|'crate'|'tangerine'|'blizzard'|'oreum'|'compost'|'wind'|'boots'|'basket'|'seeds'|'hareubang';
export type WeaponDef={id:WeaponId;name:string;desc:string;/** Where it comes from in the book. */story:string;base:WeaponStats;
 /** Levels 2..5: what each adds. */levels:{text:string;delta:Partial<WeaponStats>}[];
 /** Max level + this passive + an elite's chest → `into`. */evolve?:{with:PassiveId;into:WeaponId};
 /** An evolved weapon: it has one level and never appears in level-up choices. */evolved?:boolean};
const W=(base:Partial<WeaponStats>):WeaponStats=>({damage:10,cooldown:1,amount:1,area:1,speed:1,duration:1,pierce:1,knockback:1,...base});

export const WEAPONS:Record<WeaponId,WeaponDef>={
 swatter:{id:'swatter',name:'파리채',desc:'가장 가까운 메뚜기 쪽으로 크게 휘둘러 쳐냅니다.',story:'밤마다 밭고랑을 돌며 귀뚜라미를 잡던 농부님의 파리채.',
  base:W({damage:12,cooldown:1.15,area:1,duration:.2,pierce:99,knockback:1}),
  levels:[{text:'반대쪽으로도 한 번 더 휘둘러요.',delta:{amount:1}},{text:'공격력 +10, 범위 +10%',delta:{damage:10,area:.1}},{text:'공격력 +10',delta:{damage:10}},{text:'공격력 +15, 범위 +10%',delta:{damage:15,area:.1}}],
  evolve:{with:'gloves',into:'ghostSwatter'}},
 rape:{id:'rape',name:'당근 라페',desc:'가늘게 채 썬 당근을 가장 가까운 적에게 날립니다.',story:'채 썬 당근을 새콤하게 버무린 라페, 집에서 만드는 첫 당근 요리.',
  base:W({damage:10,cooldown:1.2,amount:1,speed:1,duration:2,pierce:1,knockback:.5}),
  levels:[{text:'투사체 +1',delta:{amount:1}},{text:'투사체 +1, 쿨다운 -0.2초',delta:{amount:1,cooldown:-.2}},{text:'공격력 +10, 관통 +1',delta:{damage:10,pierce:1}},{text:'투사체 +1, 공격력 +10',delta:{amount:1,damage:10}}],
  evolve:{with:'blizzard',into:'blizzardRape'}},
 lantern:{id:'lantern',name:'랜턴',desc:'곁의 적에게 계속 피해를 주고 살짝 밀어냅니다.',story:'“밭에서 랜턴 들고 돌아다니는 거 보면, 귀신인 줄 알 거야.”',
  base:W({damage:5,cooldown:.9,area:1,pierce:99,knockback:.35}),
  levels:[{text:'범위 +40%, 공격력 +3',delta:{area:.4,damage:3}},{text:'공격력 +2, 쿨다운 -0.15초',delta:{damage:2,cooldown:-.15}},{text:'범위 +30%, 공격력 +2',delta:{area:.3,damage:2}},{text:'범위 +30%, 공격력 +2, 쿨다운 -0.15초',delta:{area:.3,damage:2,cooldown:-.15}}],
  evolve:{with:'tangerine',into:'moonLantern'}},
 turbine:{id:'turbine',name:'바람개비',desc:'날개가 농부 둘레를 돌며 닿는 적을 칩니다.',story:'구좌 오름 너머로 도는 풍력 발전기를 닮은 바람개비.',
  base:W({damage:10,cooldown:3,amount:1,area:1,speed:1,duration:3,pierce:99,knockback:.8}),
  levels:[{text:'날개 +1',delta:{amount:1}},{text:'회전 속도 +30%, 범위 +25%, 공격력 +10',delta:{speed:.3,area:.25,damage:10}},{text:'날개 +1, 지속 +0.5초',delta:{amount:1,duration:.5}},{text:'날개 +1, 회전 속도 +30%, 범위 +25%, 지속 +0.5초, 공격력 +10',delta:{amount:1,speed:.3,area:.25,duration:.5,damage:10}}],
  evolve:{with:'oreum',into:'windFarm'}},
 burger:{id:'burger',name:'캐럿버거',desc:'위로 던진 버거가 포물선을 그리며 떨어져 적을 뚫고 지나갑니다.',story:'버거캐럿의 당근 패티 버거.',
  base:W({damage:20,cooldown:3.5,amount:1,area:1,speed:1,duration:3,pierce:3,knockback:.6}),
  levels:[{text:'투사체 +1',delta:{amount:1}},{text:'공격력 +20, 관통 +2',delta:{damage:20,pierce:2}},{text:'투사체 +1, 공격력 +20',delta:{amount:1,damage:20}},{text:'공격력 +20, 관통 +2',delta:{damage:20,pierce:2}}],
  evolve:{with:'crate',into:'burgerSet'}},
 soup:{id:'soup',name:'당근 수프',desc:'적 무리에 뜨거운 수프를 쏟아 바닥에 웅덩이를 만듭니다.',story:'마노아의 따뜻한 당근 수프.',
  base:W({damage:10,cooldown:4.5,amount:1,area:1,duration:2.2,pierce:99,knockback:0}),
  levels:[{text:'냄비 +1, 범위 +20%',delta:{amount:1,area:.2}},{text:'공격력 +10, 지속 +0.5초',delta:{damage:10,duration:.5}},{text:'냄비 +1, 범위 +20%, 공격력 +5',delta:{amount:1,area:.2,damage:5}},{text:'냄비 +1, 범위 +20%, 공격력 +10, 지속 +0.6초',delta:{amount:1,area:.2,damage:10,duration:.6}}],
  evolve:{with:'compost',into:'manoaSoup'}},
 kimbap:{id:'kimbap',name:'김밥 부메랑',desc:'가까운 적에게 던지면 멀리 갔다가 되돌아옵니다.',story:'“당근 극혐하던 6살, 이 김밥은 두 줄 먹음.” 당근 김밥.',
  base:W({damage:14,cooldown:2.2,amount:1,area:1,speed:1,duration:1.6,pierce:99,knockback:.8}),
  levels:[{text:'공격력 +10',delta:{damage:10}},{text:'투사체 +1, 범위 +10%, 속도 +25%',delta:{amount:1,area:.1,speed:.25}},{text:'공격력 +10',delta:{damage:10}},{text:'투사체 +1, 범위 +10%, 속도 +25%, 공격력 +10',delta:{amount:1,area:.1,speed:.25,damage:10}}],
  evolve:{with:'wind',into:'kimbapStorm'}},
 dog:{id:'dog',name:'바둑이',desc:'농부 곁의 제주개가 가까운 적에게 달려가 뭅니다.',story:'농부님 장화 곁에서 낮잠 자던 제주개.',
  base:W({damage:14,cooldown:.7,amount:1,area:1,speed:1,pierce:99,knockback:1}),
  levels:[{text:'공격력 +6, 달리기 +20%',delta:{damage:6,speed:.2}},{text:'제주개 +1',delta:{amount:1}},{text:'공격력 +8, 무는 간격 -0.1초',delta:{damage:8,cooldown:-.1}},{text:'제주개 +1, 공격력 +10',delta:{amount:1,damage:10}}],
  evolve:{with:'boots',into:'dogPack'}},
 ghostSwatter:{id:'ghostSwatter',name:'귀신 파리채',evolved:true,desc:'양쪽으로 크게 휘두르고, 치명타가 터지며, 맞힐 때마다 체력을 조금 되찾습니다.',story:'밤새 밭을 도는 농부를 바깥에서 보면 귀신 같다던 그 파리채.',
  base:W({damage:30,cooldown:1.1,amount:2,area:1.35,duration:.2,pierce:99,knockback:1.2}),levels:[]},
 blizzardRape:{id:'blizzardRape',name:'눈보라 라페',evolved:true,desc:'채 썬 당근이 눈보라처럼 쉼 없이 쏟아지고, 맞은 적은 느려집니다.',story:'겨울 눈보라를 맞을수록 당근은 달아집니다.',
  base:W({damage:16,cooldown:.12,amount:1,speed:1.2,duration:2,pierce:2,knockback:.4}),levels:[]},
 moonLantern:{id:'moonLantern',name:'보름달 랜턴',evolved:true,desc:'넓은 빛으로 적을 태우고, 빛에 닿은 적에게서 체력을 되찾습니다.',story:'귤빛 보름달 아래 밭고랑을 도는 밤.',
  base:W({damage:12,cooldown:.55,area:2.4,pierce:99,knockback:.5}),levels:[]},
 windFarm:{id:'windFarm',name:'구좌 풍력발전기',evolved:true,desc:'커다란 날개가 멈추지 않고 돕니다.',story:'구좌 바다 바람으로 도는 하얀 풍력 발전기.',
  base:W({damage:22,cooldown:0,amount:4,area:1.7,speed:1.3,duration:1,pierce:99,knockback:1}),levels:[]},
 burgerSet:{id:'burgerSet',name:'캐럿버거 세트',evolved:true,desc:'버거가 떨어진 자리에서 캐럿프라이즈가 사방으로 튀어 나갑니다.',story:'버거캐럿의 캐럿버거와 캐럿프라이즈.',
  base:W({damage:40,cooldown:2.6,amount:3,area:1.2,speed:1,duration:3,pierce:6,knockback:.8}),levels:[]},
 manoaSoup:{id:'manoaSoup',name:'마노아 특제 수프',evolved:true,desc:'웅덩이가 점점 커지며 농부 곁으로 따라옵니다.',story:'마노아 사장님이 끓이는 진한 당근 수프.',
  base:W({damage:20,cooldown:4,amount:3,area:1.6,duration:4,pierce:99,knockback:0}),levels:[]},
 kimbapStorm:{id:'kimbapStorm',name:'꼬마김밥 회오리',evolved:true,desc:'꼬마김밥이 사방으로 날아갔다 돌아옵니다.',story:'구좌 바람을 타고 도는 꼬마김밥.',
  base:W({damage:30,cooldown:1.8,amount:6,area:1.2,speed:1.3,duration:1.6,pierce:99,knockback:1}),levels:[]},
 dogPack:{id:'dogPack',name:'제주개 무리',evolved:true,desc:'제주개 넷이 쉬지 않고 달려 나가 크게 물고 밀쳐 냅니다.',story:'장화 신은 농부 따라 밭을 누비는 동네 개들.',
  base:W({damage:30,cooldown:.5,amount:4,area:1.3,speed:1.5,pierce:99,knockback:2.2}),levels:[]},
};
/** Weapons that can be offered at a level-up (not the evolved ones). */
export const BASE_WEAPONS=(Object.keys(WEAPONS) as WeaponId[]).filter(id=>!WEAPONS[id].evolved);

export type PassiveDef={id:PassiveId;name:string;desc:string;story:string;max:number;stat:StatKey;/** Added per level. */per:number};
export const PASSIVES:Record<PassiveId,PassiveDef>={
 gloves:{id:'gloves',name:'농부 장갑',desc:'공격력 +10%',story:'밭일로 닳은 목장갑.',max:5,stat:'might',per:.1},
 soil:{id:'soil',name:'검은 화산토',desc:'받는 피해 -1',story:'물 빠짐 좋은 구좌의 검은 흙처럼 단단하게.',max:5,stat:'armor',per:1},
 crate:{id:'crate',name:'당근 상자',desc:'최대 체력 +20%',story:'수확한 당근을 가득 담은 나무 상자.',max:5,stat:'maxHp',per:.2},
 tangerine:{id:'tangerine',name:'제주 귤',desc:'초당 체력 회복 +0.2',story:'겨울 밭일 틈에 까먹는 귤 한 알.',max:5,stat:'recovery',per:.2},
 blizzard:{id:'blizzard',name:'겨울 눈보라',desc:'쿨다운 -8%',story:'눈보라를 견딘 당근은 당분을 뿌리로 모읍니다.',max:5,stat:'cooldown',per:-.08},
 oreum:{id:'oreum',name:'오름 전망',desc:'공격 범위 +10%',story:'오름 꼭대기에서 내려다본 넓은 당근밭.',max:5,stat:'area',per:.1},
 compost:{id:'compost',name:'유기농 거름',desc:'효과 지속 +10%',story:'농약 대신 정성으로 키운 흙.',max:5,stat:'duration',per:.1},
 wind:{id:'wind',name:'구좌 바람',desc:'투사체 속도 +10%',story:'풍력 발전기를 돌리는 바닷바람.',max:5,stat:'speed',per:.1},
 boots:{id:'boots',name:'장화',desc:'이동 속도 +10%',story:'진흙 밭고랑도 성큼성큼.',max:5,stat:'moveSpeed',per:.1},
 basket:{id:'basket',name:'수확 바구니',desc:'당근 줍는 거리 +30%',story:'한 번에 더 많이 담아요.',max:5,stat:'magnet',per:.3},
 seeds:{id:'seeds',name:'씨앗 주머니',desc:'투사체 수 +1',story:'한 줌 더 뿌리는 당근 씨앗.',max:2,stat:'amount',per:1},
 hareubang:{id:'hareubang',name:'돌하르방',desc:'행운 +10%',story:'밭 어귀를 지키는 돌하르방의 행운.',max:5,stat:'luck',per:.1},
};
export const PASSIVE_IDS=Object.keys(PASSIVES) as PassiveId[];

export type EnemyId='hopper'|'cricket'|'swarm'|'locust'|'stinger'|'armored'|'bigCricket'|'elite'|'king'|'bale';
export type EnemyDef={id:EnemyId;name:string;hp:number;speed:number;damage:number;xp:number;r:number;/** 0 = pushed back fully, 1 = not at all. */knockRes:number;
 move:'chase'|'lunge'|'flock'|'static'|'boss'};
export const ENEMIES:Record<EnemyId,EnemyDef>={
 hopper:{id:'hopper',name:'메뚜기',hp:8,speed:78,damage:3,xp:1,r:12,knockRes:0,move:'chase'},
 cricket:{id:'cricket',name:'귀뚜라미',hp:14,speed:56,damage:6,xp:2,r:12,knockRes:.1,move:'lunge'},
 swarm:{id:'swarm',name:'메뚜기 떼',hp:6,speed:195,damage:4,xp:1,r:10,knockRes:.5,move:'flock'},
 locust:{id:'locust',name:'풀무치',hp:45,speed:50,damage:8,xp:4,r:20,knockRes:.6,move:'chase'},
 // From 6:00: a fast one that closes the gap, and an armoured one that soaks up hits.
 stinger:{id:'stinger',name:'날쌘메뚜기',hp:36,speed:112,damage:8,xp:3,r:13,knockRes:.2,move:'chase'},
 armored:{id:'armored',name:'철갑풀무치',hp:150,speed:56,damage:14,xp:8,r:23,knockRes:.8,move:'chase'},
 // The ones that "pour out" of the rocks in the set pieces.
 bigCricket:{id:'bigCricket',name:'왕귀뚜라미',hp:110,speed:62,damage:9,xp:6,r:17,knockRes:.4,move:'lunge'},
 elite:{id:'elite',name:'장수메뚜기',hp:240,speed:66,damage:14,xp:30,r:30,knockRes:.9,move:'chase'},
 king:{id:'king',name:'메뚜기 대왕',hp:5000,speed:64,damage:24,xp:0,r:58,knockRes:1,move:'boss'},
 bale:{id:'bale',name:'짚단',hp:1,speed:0,damage:0,xp:0,r:18,knockRes:1,move:'static'},
};

/** One row per minute: keep at least `min` enemies around, add a `batch` every `every` seconds, picked by `mix` weight. */
export type Wave={min:number;every:number;batch:number;mix:Partial<Record<EnemyId,number>>};
export const WAVES:Wave[]=[
 {min:14,every:.9,batch:2,mix:{hopper:1}},
 {min:29,every:.8,batch:3,mix:{hopper:.75,cricket:.25}},
 {min:43,every:.7,batch:3,mix:{hopper:.55,cricket:.45}},
 {min:60,every:.6,batch:4,mix:{hopper:.4,cricket:.4,locust:.2}},
 {min:84,every:.55,batch:4,mix:{hopper:.32,cricket:.32,locust:.28,stinger:.08}},
 {min:108,every:.5,batch:5,mix:{hopper:.26,cricket:.3,locust:.28,stinger:.12,armored:.04}},
 {min:126,every:.45,batch:5,mix:{hopper:.2,cricket:.28,locust:.28,stinger:.16,armored:.08}},
 {min:144,every:.4,batch:6,mix:{hopper:.15,cricket:.25,locust:.3,stinger:.2,armored:.1}},
 {min:168,every:.35,batch:6,mix:{hopper:.1,cricket:.25,locust:.3,stinger:.2,armored:.15}},
 {min:192,every:.3,batch:7,mix:{hopper:.1,cricket:.2,locust:.3,stinger:.2,armored:.2}},
 {min:48,every:.6,batch:3,mix:{hopper:.5,cricket:.5}},
];
export const ENEMY_CAP=380;
/** Set pieces: a flock crossing the screen, a ring closing in, an elite carrying a chest, and the king at the end. */
/** `boost` multiplies the health of what the event brings (and adds a little to its damage and size). */
export type GameEventDef={t:number;kind:'flock'|'ring'|'elite'|'king';enemy?:EnemyId;count?:number;banner?:string;boost?:number};
export const EVENTS:GameEventDef[]=[
 {t:45,kind:'flock',enemy:'swarm',count:20,banner:'메뚜기 떼가 날아든다!'},
 {t:120,kind:'elite',banner:'장수메뚜기 등장! 쓰러뜨리면 당근 상자를 떨어뜨려요'},
 {t:150,kind:'flock',enemy:'swarm',count:30},
 {t:210,kind:'ring',enemy:'hopper',count:32,banner:'메뚜기들이 둘러쌌다!'},
 {t:240,kind:'elite'},
 {t:240,kind:'flock',enemy:'stinger',count:8,banner:'날쌘메뚜기가 나타났다!'},
 {t:285,kind:'flock',enemy:'locust',count:18,boost:1.3,banner:'풀무치가 한쪽에서 쏟아진다!'},
 {t:300,kind:'flock',enemy:'swarm',count:44,banner:'메뚜기 떼 대습격!'},
 {t:300,kind:'elite'},
 {t:360,kind:'elite'},
 {t:330,kind:'flock',enemy:'armored',count:6,banner:'철갑풀무치가 나타났다!'},
 {t:360,kind:'flock',enemy:'swarm',count:30},
 {t:390,kind:'ring',enemy:'bigCricket',count:22,boost:1.5,banner:'왕귀뚜라미가 바위 틈에서 쏟아진다!'},
 {t:450,kind:'flock',enemy:'swarm',count:56},
 {t:480,kind:'elite'},{t:482,kind:'elite'},
 {t:510,kind:'ring',enemy:'armored',count:20,boost:1.8,banner:'철갑풀무치가 땅속에서 쏟아진다!'},
 {t:540,kind:'ring',enemy:'locust',count:36,banner:'풀무치가 몰려온다!'},
 {t:570,kind:'elite'},
 {t:RUN_SECONDS,kind:'king',banner:'메뚜기 대왕이 나타났다!'},
];

/** Experience needed to go from `level` to the next. */
export const xpToNext=(level:number)=>level<20?6+(level-1)*5:level<40?100+(level-20)*12:340+(level-40)*20;

export type CharId='farmer'|'traveler';
export type CharDef={id:CharId;name:string;desc:string;weapon:WeaponId;bonus:Partial<Stats>;bonusText:string;img:string};
export const CHARACTERS:Record<CharId,CharDef>={
 farmer:{id:'farmer',name:'구좌 당근 농부',desc:'밤마다 랜턴과 파리채를 들고 밭고랑을 도는 농부. 이번엔 메뚜기 떼다!',weapon:'swatter',bonus:{maxHp:20,armor:1},bonusText:'최대 체력 +20, 방어 +1',img:'char-farmer'},
 traveler:{id:'traveler',name:'당근 여행자',desc:'당근을 따라 구좌를 찾아온 여행자. 가방 속 당근 김밥이 무기.',weapon:'kimbap',bonus:{moveSpeed:.1,magnet:.3},bonusText:'이동 속도 +10%, 자석 +30%',img:'char-traveler'},
};

export type ShopId='sonongroad'|'manoa'|'buggercarrot';
export type ShopItemId='juice'|'latte'|'sorbet'|'soup'|'jam'|'panini'|'burger'|'fries'|'special';
export type ShopItem={id:ShopItemId;name:string;desc:string;price:number};
export type ShopDef={id:ShopId;name:string;tagline:string;img:string;x:number;y:number;color:string;items:ShopItem[]};
/** The three shops of chapter 2 stand on the road at fixed places; each closes for SHOP_REST seconds after a visit. */
export const SHOP_REST=70,SHOP_RADIUS=95;
export const SHOPS:Record<ShopId,ShopDef>={
 sonongroad:{id:'sonongroad',name:'소농로드',tagline:'당근 주스 한 잔에 숨 돌리고 가세요',img:'sonongroad',x:880,y:-620,color:'#e9823a',items:[
  {id:'juice',name:'당근 주스',desc:'체력 40% 회복',price:15},
  {id:'latte',name:'당근 라떼',desc:'60초 동안 이동 속도 +25%, 쿨다운 -15%',price:25},
  {id:'sorbet',name:'당근 소르베',desc:'모든 적을 8초 동안 얼립니다',price:30}]},
 manoa:{id:'manoa',name:'마노아',tagline:'따뜻한 수프와 파니니로 든든하게',img:'manoa',x:-960,y:-330,color:'#c8743a',items:[
  {id:'soup',name:'당근수프',desc:'체력을 모두 회복',price:35},
  {id:'jam',name:'당근잼',desc:'이번 판 최대 체력 +20',price:35},
  {id:'panini',name:'당근파니니',desc:'바로 레벨 업 한 번 (선택)',price:50}]},
 buggercarrot:{id:'buggercarrot',name:'버거캐럿',tagline:'캐럿버거 먹고 힘내서 다시 밭으로',img:'buggercarrot',x:160,y:1020,color:'#d9612e',items:[
  {id:'burger',name:'캐럿버거',desc:'체력 50% 회복, 60초 동안 공격력 +30%',price:30},
  {id:'fries',name:'캐럿프라이즈',desc:'맵에 떨어진 당근을 모두 끌어옵니다',price:20},
  {id:'special',name:'특제 강화',desc:'진화할 수 있는 무기를 진화시키거나, 무기 하나를 2레벨 올립니다',price:80}]},
};
export const SHOP_IDS=Object.keys(SHOPS) as ShopId[];

/** Things on the ground. */
export type PickupId='juice'|'gust'|'frost'|'torch'|'coin'|'bag'|'chest';
export const PICKUPS:Record<PickupId,{name:string;desc:string}>={
 juice:{name:'당근 주스',desc:'체력 30 회복'},gust:{name:'구좌 돌풍',desc:'모든 당근을 끌어와요'},frost:{name:'한파',desc:'적이 잠시 얼어요'},
 torch:{name:'밤샘 랜턴',desc:'화면의 적을 모두 쫓아내요'},coin:{name:'당근 코인',desc:'코인 1'},bag:{name:'코인 꾸러미',desc:'코인 10'},chest:{name:'당근 상자',desc:'무기 진화·강화'},
};

/** Lasting upgrades bought with coins between runs ("농사 수첩"). */
export type PowerUp={id:StatKey;name:string;desc:string;per:number;max:number;cost:number};
export const POWERUPS:PowerUp[]=[
 {id:'might',name:'힘',desc:'공격력 +5%',per:.05,max:5,cost:100},
 {id:'armor',name:'단단한 흙',desc:'받는 피해 -1',per:1,max:3,cost:300},
 {id:'maxHp',name:'든든한 밥심',desc:'최대 체력 +10%',per:.1,max:3,cost:100},
 {id:'recovery',name:'귤 한 바구니',desc:'초당 회복 +0.1',per:.1,max:5,cost:100},
 {id:'cooldown',name:'부지런함',desc:'쿨다운 -2.5%',per:-.025,max:2,cost:450},
 {id:'area',name:'넓은 밭',desc:'범위 +5%',per:.05,max:2,cost:150},
 {id:'speed',name:'바닷바람',desc:'투사체 속도 +10%',per:.1,max:2,cost:150},
 {id:'duration',name:'뚝심',desc:'지속 시간 +15%',per:.15,max:2,cost:150},
 {id:'moveSpeed',name:'날랜 걸음',desc:'이동 속도 +5%',per:.05,max:2,cost:150},
 {id:'magnet',name:'큰 바구니',desc:'자석 +25%',per:.25,max:2,cost:150},
 {id:'luck',name:'행운',desc:'행운 +10%',per:.1,max:3,cost:300},
 {id:'growth',name:'성장',desc:'경험치 +3%',per:.03,max:5,cost:450},
 {id:'greed',name:'알뜰살뜰',desc:'코인 +10%',per:.1,max:5,cost:100},
 {id:'amount',name:'두 손 가득',desc:'투사체 수 +1',per:1,max:1,cost:1500},
 {id:'revival',name:'다시 일어서기',desc:'한 번 쓰러져도 다시 일어나요',per:1,max:1,cost:1500},
];
export const powerUpCost=(p:PowerUp,level:number)=>p.cost*(level+1);
