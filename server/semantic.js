/**
 * 露营与出行物资 - 中文模糊语义归一化与聚类引擎
 * 特性：
 * 1. 零外部依赖、极快响应、100% 本地运行
 * 2. 叠词/误输入消除 (如: 可乐可乐 -> 可乐, 纸巾纸巾 -> 纸巾)
 * 3. 前缀修饰词/规格/温度/包装剥离 (如: 冰镇可乐 -> 可乐, 加厚折叠蛋卷桌 -> 蛋卷桌, 大桶饮用水 -> 饮用水)
 * 4. 露营与聚餐常见品类/品牌同义词归一 (如: 百事可乐 / 可口可乐 -> 可乐, 农夫山泉 / 矿泉水 -> 饮用水)
 * 5. 通用核心词根聚类算法 (未在同义词表中的自定义商品，也能自动聚合)
 */

// 常见状态/温度/规格/包装/场景修饰前缀
const PREFIXES = [
  '冰镇', '冰冻', '冷藏', '常温', '温热', '现烤', '自制', '现切', '新鲜', '纯正',
  '大号', '中号', '小号', '超大', '加大', '特大', '加厚', '特厚', '加长',
  '便携式', '便携', '折叠式', '折叠', '迷你', '双人', '单人', '大桶',
  '一次性', '露营', '户外', '野餐', '野营', '家用',
  '无糖', '零度', '低糖', '原味', '精酿', '鲜榨', '微糖', '加糖',
  '瓶装', '罐装', '听装', '箱装', '袋装', '盒装', '桶装',
  '烤', '煮', '卤'
];

// 常见包装/规格后缀
const SUFFIXES = [
  '一箱', '一提', '一袋', '一包', '一盒', '一瓶', '一听', '一桶',
  '1箱', '1提', '1袋', '1包', '1盒', '1瓶', '1听', '1桶'
];

// 常见露营与聚餐品类同义词映射库
const CORE_SYNONYMS = [
  { core: '可乐', keywords: ['可乐', '可口可乐', '百事可乐', '百事', 'coca-cola', 'pepsi', 'cola'] },
  { core: '雪碧', keywords: ['雪碧', '七喜', '芬达', 'sprite'] },
  { core: '饮用水', keywords: ['矿泉水', '纯净水', '饮用水', '农夫山泉', '怡宝', '百岁山', '娃哈哈', '景田', '桶装水', '大桶水'] },
  { core: '啤酒', keywords: ['啤酒', '青岛啤酒', '百威', '乌苏', '精酿啤酒', '喜力', '纯生', 'beer'] },
  { core: '果汁', keywords: ['橙汁', '苹果汁', '西瓜汁', '椰汁', '果汁', '汇源'] },
  { core: '驱蚊水', keywords: ['驱蚊水', '驱蚊液', '驱蚊喷雾', '花露水', '六神', '防蚊水', '防蚊喷雾', '防蚊液'] },
  { core: '垃圾袋', keywords: ['垃圾袋', '垃圾桶袋', '黑色垃圾袋'] },
  { core: '纸巾', keywords: ['纸巾', '抽纸', '卷纸', '餐巾纸', '卫生纸', '面巾纸'] },
  { core: '湿巾', keywords: ['湿巾', '湿纸巾', '酒精湿巾', '消毒湿巾'] },
  { core: '蛋卷桌', keywords: ['蛋卷桌', '折叠桌', '露营桌', '野餐桌'] },
  { core: '露营椅', keywords: ['克米特椅', '露营椅', '折叠椅', '月亮椅', '户外椅', '马扎'] },
  { core: '卡式炉', keywords: ['卡式炉', '瓦斯炉', '气炉', '便携炉'] },
  { core: '气罐', keywords: ['气罐', '瓦斯罐', '瓦斯气罐', '高山气罐', '卡式炉气罐', '燃气罐'] },
  { core: '木炭', keywords: ['木炭', '烧烤炭', '机制炭', '无烟炭'] },
  { core: '烧烤炉', keywords: ['烧烤炉', '烧烤架', '烤架', '炭烤架', '炭烤炉'] },
  { core: '帐篷', keywords: ['帐篷', '露营帐篷', '速开帐篷', '自动帐篷'] },
  { core: '天幕', keywords: ['天幕', '防晒天幕', '遮阳天幕', '黑胶天幕'] },
  { core: '防潮垫', keywords: ['防潮垫', '野餐垫', '地席', '充气垫', '铝箔垫'] },
  { core: '营地灯', keywords: ['营地灯', '露营灯', '帐篷灯', '氛围灯', '手电筒'] },
  { core: '一次性纸杯', keywords: ['纸杯', '一次性纸杯', '一次性杯子'] },
  { core: '一次性餐具', keywords: ['一次性碗筷', '一次性餐具', '一次性筷子', '纸碗', '塑料碗'] }
];

/**
 * 剥离修饰词与消除叠词，提取基础词干 (Stem)
 */
function extractStem(name) {
  let res = (name || '').trim();
  if (!res) return '';

  // 1. 去除括号说明，如 "可乐(大瓶)" 或 "可乐（冰镇）"
  res = res.replace(/[\(（][^\)）]+[\)）]/g, '').trim();

  // 2. 叠词消除（如 "可乐可乐" -> "可乐", "纸巾纸巾" -> "纸巾"）
  // 仅对2个字符及以上的词根进行叠词剥离，防止将“串串”缩减成“串”
  res = res.replace(/(.{2,})\1+$/g, '$1');

  // 3. 循环剥离前缀修饰词
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of PREFIXES) {
      if (res.startsWith(p) && res.length > p.length + 1) {
        res = res.slice(p.length).trim();
        changed = true;
        break;
      }
    }
  }

  // 4. 循环剥离后缀修饰词
  changed = true;
  while (changed) {
    changed = false;
    for (const s of SUFFIXES) {
      if (res.endsWith(s) && res.length > s.length + 1) {
        res = res.slice(0, -s.length).trim();
        changed = true;
        break;
      }
    }
  }

  // 5. 再次检测叠词消除
  res = res.replace(/(.{2,})\1+$/g, '$1');

  return res.toLowerCase().trim();
}

/**
 * 查找品类同义词代表核心词
 */
function matchSynonymCore(stem) {
  if (!stem) return null;
  for (const syn of CORE_SYNONYMS) {
    for (const k of syn.keywords) {
      const lowerK = k.toLowerCase();
      // 完全匹配
      if (stem === lowerK) return syn.core;
      // 词干以关键词结尾或包含（关键词长度>=2）
      if (lowerK.length >= 2) {
        if (stem.endsWith(lowerK) || stem.includes(lowerK)) {
          return syn.core;
        }
      }
    }
  }
  return null;
}

/**
 * 获取某个物品名称的完整语义画像
 */
function getSemanticInfo(name) {
  const clean = (name || '').trim();
  const stem = extractStem(clean);
  const synonymCore = matchSynonymCore(stem);
  const core = synonymCore || stem || clean;

  return {
    raw: clean,
    stem: stem,
    core: core,
    isSynonymMatched: Boolean(synonymCore)
  };
}

/**
 * 判断 a 和 b 是否属于纯粹的叠词重复关系 (如 可乐 vs 可乐可乐, 纸巾 vs 纸巾纸巾)
 */
function isPureStutter(a, b) {
  const lowerA = (a || '').trim().toLowerCase();
  const lowerB = (b || '').trim().toLowerCase();
  if (!lowerA || !lowerB) return false;
  if (lowerA === lowerB) return false;
  if (lowerA === lowerB + lowerB || lowerB === lowerA + lowerA) return true;
  const noRepeatA = lowerA.replace(/(.{2,})\1+$/g, '$1');
  const noRepeatB = lowerB.replace(/(.{2,})\1+$/g, '$1');
  if (noRepeatA === lowerB) return true;
  if (noRepeatB === lowerA) return true;
  return false;
}

/**
 * 判断两个名称是否语义相同或极度相似
 * 返回 { isMatch: boolean, level: 'EXACT'|'STUTTER'|'SIMILAR'|null, reason: string }
 */
function compareSemantic(nameA, nameB) {
  const cleanA = (nameA || '').trim();
  const cleanB = (nameB || '').trim();
  if (!cleanA || !cleanB) return { isMatch: false, level: null, reason: '' };

  if (cleanA.toLowerCase() === cleanB.toLowerCase()) {
    return { isMatch: true, level: 'EXACT', reason: '完全同名' };
  }

  // 纯叠词判断（如 可乐 vs 可乐可乐, 纸巾 vs 纸巾纸巾）
  if (isPureStutter(cleanA, cleanB)) {
    return { isMatch: true, level: 'STUTTER', reason: '叠词输入重复' };
  }

  const stemA = extractStem(cleanA);
  const stemB = extractStem(cleanB);
  const infoA = getSemanticInfo(cleanA);
  const infoB = getSemanticInfo(cleanB);

  // 核心词一致（如 可乐 vs 冰镇可乐, 可乐 vs 百事可乐）
  if (infoA.core === infoB.core) {
    return { isMatch: true, level: 'SIMILAR', reason: `同属【${infoA.core}】品类物资` };
  }

  // 词干相同
  if (stemA === stemB) {
    return { isMatch: true, level: 'SIMILAR', reason: `核心均为【${stemA}】同类物资` };
  }

  // 自定义词根后缀包含（如 麒麟西瓜 与 西瓜，蓝牙音箱 与 音箱）
  if (stemA.length >= 2 && stemB.length >= 2) {
    if (stemA.endsWith(stemB) || stemB.endsWith(stemA)) {
      const shorter = stemA.length <= stemB.length ? stemA : stemB;
      return { isMatch: true, level: 'SIMILAR', reason: `同属【${shorter}】同类物资` };
    }
  }

  return { isMatch: false, level: null, reason: '' };
}

/**
 * 将房间内所有的条目进行模糊语义聚类聚合，生成最终汇总清单 (Summary List)
 * @param {Array} allItems 房间所有物品数据
 * @param {Object} membersMap 成员 ID 到成员信息的字典
 * @param {Array} palettes 配色板
 * @returns {Array} 聚合后的 summaryList
 */
function clusterSummaryList(allItems, membersMap, defaultPalette) {
  if (!Array.isArray(allItems) || allItems.length === 0) {
    return [];
  }

  // 阶段 1：使用 semantic.core 进行初步分组
  const groupsMap = new Map(); // Map<coreKey, GroupObject>

  allItems.forEach(item => {
    const rawName = (item.name || '').trim();
    const info = getSemanticInfo(rawName);
    const coreKey = info.core;

    if (!groupsMap.has(coreKey)) {
      groupsMap.set(coreKey, {
        core: coreKey,
        isSynonymMatched: info.isSynonymMatched,
        items: []
      });
    }
    groupsMap.get(coreKey).items.push(item);
  });

  // 阶段 2：二次归并自定义非标准品名（例如同时存在 '西瓜' 和 '麒麟西瓜'，后者并入前者）
  const groupsList = Array.from(groupsMap.values());
  const mergedGroups = [];
  const mergedIndices = new Set();

  for (let i = 0; i < groupsList.length; i++) {
    if (mergedIndices.has(i)) continue;
    const g1 = groupsList[i];

    for (let j = 0; j < groupsList.length; j++) {
      if (i === j || mergedIndices.has(j)) continue;
      const g2 = groupsList[j];

      // 若其中一个是以另一个为核心后缀的自定义条目且未匹配官方同义词
      // 例如：g1.core = '西瓜', g2.core = '麒麟西瓜' -> g2 并入 g1
      if (!g1.isSynonymMatched && !g2.isSynonymMatched) {
        if (g2.core.endsWith(g1.core) && g1.core.length >= 2) {
          g1.items.push(...g2.items);
          mergedIndices.add(j);
        } else if (g1.core.endsWith(g2.core) && g2.core.length >= 2) {
          g2.items.push(...g1.items);
          mergedIndices.add(i);
          break;
        }
      }
    }

    if (!mergedIndices.has(i)) {
      mergedGroups.push(g1);
    }
  }

  // 阶段 3：组装最终汇总条目
  const summaryList = mergedGroups.map(group => {
    const items = group.items;
    const userSet = new Set();
    const contributorsMap = new Map(); // Map<userId, ContributorRecord>
    const variantNamesSet = new Set();

    let totalQuantity = 0;
    let allChecked = true;

    items.forEach(it => {
      const q = it.quantity || 1;
      totalQuantity += q;
      userSet.add(it.user_id);
      if (it.is_checked !== 1) {
        allChecked = false;
      }

      const cleanItName = (it.name || '').trim();
      variantNamesSet.add(cleanItName);

      // 统计每位贡献者带来的数量及填写的具体物品名称
      if (!contributorsMap.has(it.user_id)) {
        const member = membersMap[it.user_id];
        const theme = member?.theme || member?.colorTheme || defaultPalette;
        contributorsMap.set(it.user_id, {
          userId: it.user_id,
          nickname: it.nickname || member?.nickname || '成员',
          phoneTail: it.phone ? it.phone.slice(-4) : '',
          quantity: 0,
          rawNames: [],
          itemsDetail: [],
          theme: theme,
          colorTheme: theme
        });
      }

      const cRec = contributorsMap.get(it.user_id);
      cRec.quantity += q;
      if (!cRec.rawNames.includes(cleanItName)) {
        cRec.rawNames.push(cleanItName);
      }
      cRec.itemsDetail.push({
        id: it.id,
        name: cleanItName,
        quantity: q,
        isChecked: it.is_checked === 1
      });
    });

    const userCount = userSet.size;
    const isDuplicate = userCount > 1; // 撞车：超过1人准备同类物资
    const variants = Array.from(variantNamesSet);
    const hasVariants = variants.length > 1;

    // 智能选取最优显示名称：
    // 1. 如果原始名称中有正好等于 core 的（如"可乐"），优先用 core；
    // 2. 如果所有人填写的完全一样（如大家都是"百事可乐"），用大家一致的名字；
    // 3. 否则使用 core
    let displayName = group.core;
    if (!variants.includes(group.core) && variants.length === 1) {
      displayName = variants[0];
    }

    // 生成变体说明摘要（例如：含：百事可乐、冰镇可乐、可乐可乐）
    let variantsSummary = '';
    if (hasVariants) {
      const otherVariants = variants.filter(v => v !== displayName);
      const displayList = otherVariants.length > 0 ? otherVariants : variants;
      variantsSummary = `含：${displayList.slice(0, 3).join('、')}${displayList.length > 3 ? '等' : ''}`;
    }

    // 格式化贡献者信息
    const contributors = Array.from(contributorsMap.values()).map(c => {
      // 拼接用户带的名称（如 "带了【冰镇可乐】×1"）
      const namesText = c.rawNames.join('、');
      return {
        ...c,
        namesText: namesText
      };
    });

    return {
      name: displayName,
      coreName: group.core,
      totalQuantity: totalQuantity,
      userCount: userCount,
      isDuplicate: isDuplicate,
      duplicateCount: userCount,
      hasVariants: hasVariants,
      variants: variants,
      variantsSummary: variantsSummary,
      contributors: contributors,
      items: items,
      allChecked: allChecked
    };
  });

  // 按是否重复、总数量降序排序（重复的置顶提醒）
  summaryList.sort((a, b) => {
    if (a.isDuplicate && !b.isDuplicate) return -1;
    if (!a.isDuplicate && b.isDuplicate) return 1;
    return b.totalQuantity - a.totalQuantity;
  });

  return summaryList;
}

module.exports = {
  extractStem,
  getSemanticInfo,
  compareSemantic,
  clusterSummaryList
};
