// 露营物资助手 - 前端应用主逻辑
(function () {
  'use strict';

  // 应用全局状态
  const state = {
    currentUser: null,
    currentRoomId: Api.getCurrentRoomId() || '1',
    currentRoom: null,
    boardData: null,
    lastBoardSignature: '',
    templatesData: null,
    activeRecCategory: '',
    selectedRecItems: new Set(),
    editingItem: null,
    selectedChecklistUserId: null, // 默认当前用户ID
    authMode: 'login', // 'login' | 'register'
    systemInfo: null,
    activeRoomFilter: 'active' // 'active' | 'archived'
  };

  // DOM 元素引用
  const dom = {
    // 顶部
    currentRoomCode: document.getElementById('currentRoomCode'),
    currentRoomTitle: document.getElementById('currentRoomTitle'),
    btnSwitchRoom: document.getElementById('btnSwitchRoom'),
    btnRefresh: document.getElementById('btnRefresh'),
    btnOpenShareModal: document.getElementById('btnOpenShareModal'),
    syncStatusBadge: document.getElementById('syncStatusBadge'),
    liveNoticeBanner: document.getElementById('liveNoticeBanner'),
    liveNoticeText: document.getElementById('liveNoticeText'),

    // Tab 导航
    tabButtons: document.querySelectorAll('.bottom-tabbar .tab-item'),
    tabViews: document.querySelectorAll('.tab-view'),

    // 首页 (协同工作台)
    archivedNoticeBanner: document.getElementById('archivedNoticeBanner'),
    myListColumn: document.getElementById('myListColumn'),
    myColHeader: document.getElementById('myColHeader'),
    myColTitleWrap: document.getElementById('myColTitleWrap'),
    myAvatarDot: document.getElementById('myAvatarDot'),
    myColTitle: document.getElementById('myColTitle'),
    myMeTag: document.getElementById('myMeTag'),
    btnEditRoomNickname: document.getElementById('btnEditRoomNickname'),
    myCountBadge: document.getElementById('myCountBadge'),
    myItemsList: document.getElementById('myItemsList'),
    inputQuickAdd: document.getElementById('inputQuickAdd'),
    btnAddQuickItem: document.getElementById('btnAddQuickItem'),
    othersCountBadge: document.getElementById('othersCountBadge'),
    othersColumnsScroll: document.getElementById('othersColumnsScroll'),
    summaryDuplicateStats: document.getElementById('summaryDuplicateStats'),
    summaryTotalStats: document.getElementById('summaryTotalStats'),
    summaryItemsGrid: document.getElementById('summaryItemsGrid'),

    // 推荐库
    recommendCatTabs: document.getElementById('recommendCatTabs'),
    recommendList: document.getElementById('recommendList'),
    selectedRecCount: document.getElementById('selectedRecCount'),
    btnBatchImport: document.getElementById('btnBatchImport'),

    // 清单核对
    checkProgressText: document.getElementById('checkProgressText'),
    checkProgressBar: document.getElementById('checkProgressBar'),
    checklistUserTabs: document.getElementById('checklistUserTabs'),
    checklistItemsContainer: document.getElementById('checklistItemsContainer'),

    // 我的
    profileAvatar: document.getElementById('profileAvatar'),
    profileNickname: document.getElementById('profileNickname'),
    btnEditNickname: document.getElementById('btnEditNickname'),
    profilePhone: document.getElementById('profilePhone'),
    btnLogout: document.getElementById('btnLogout'),
    activeRoomsCount: document.getElementById('activeRoomsCount'),
    archivedRoomsCount: document.getElementById('archivedRoomsCount'),
    roomFilterTabs: document.querySelectorAll('.room-filter-tab'),
    myRoomsList: document.getElementById('myRoomsList'),
    btnOpenCreateRoomModal: document.getElementById('btnOpenCreateRoomModal'),
    btnOpenJoinRoomModal: document.getElementById('btnOpenJoinRoomModal'),

    // 弹窗与抽屉
    itemActionModal: document.getElementById('itemActionModal'),
    modalEditName: document.getElementById('modalEditName'),
    modalEditQuantity: document.getElementById('modalEditQuantity'),
    modalBtnMinus: document.getElementById('modalBtnMinus'),
    modalBtnPlus: document.getElementById('modalBtnPlus'),
    modalBtnSave: document.getElementById('modalBtnSave'),
    modalBtnDelete: document.getElementById('modalBtnDelete'),
    modalBtnCancel: document.getElementById('modalBtnCancel'),

    summaryDetailModal: document.getElementById('summaryDetailModal'),
    summaryDetailName: document.getElementById('summaryDetailName'),
    summaryDetailTag: document.getElementById('summaryDetailTag'),
    summaryDetailVariantsBanner: document.getElementById('summaryDetailVariantsBanner'),
    summaryContributorsList: document.getElementById('summaryContributorsList'),
    modalBtnCloseDetail: document.getElementById('modalBtnCloseDetail'),

    authModal: document.getElementById('authModal'),
    authForm: document.getElementById('authForm'),
    authTitle: document.getElementById('authTitle'),
    authPhone: document.getElementById('authPhone'),
    authPassword: document.getElementById('authPassword'),
    authNickname: document.getElementById('authNickname'),
    groupNickname: document.getElementById('groupNickname'),
    authErrorMsg: document.getElementById('authErrorMsg'),
    btnAuthSubmit: document.getElementById('btnAuthSubmit'),
    btnToggleAuthMode: document.getElementById('btnToggleAuthMode'),
    authToggleHint: document.getElementById('authToggleHint'),

    roomModal: document.getElementById('roomModal'),
    roomModalLogo: document.getElementById('roomModalLogo'),
    roomModalTitle: document.getElementById('roomModalTitle'),
    roomModalSub: document.getElementById('roomModalSub'),
    createRoomSection: document.getElementById('createRoomSection'),
    joinRoomSection: document.getElementById('joinRoomSection'),
    formCreateRoom: document.getElementById('formCreateRoom'),
    formJoinRoom: document.getElementById('formJoinRoom'),
    inputNewRoomTitle: document.getElementById('inputNewRoomTitle'),
    btnSubmitCreateRoom: document.getElementById('btnSubmitCreateRoom'),
    btnCancelCreateRoom: document.getElementById('btnCancelCreateRoom'),
    createRoomError: document.getElementById('createRoomError'),
    inputJoinRoomCode: document.getElementById('inputJoinRoomCode'),
    btnSubmitJoinRoom: document.getElementById('btnSubmitJoinRoom'),
    btnCancelJoinRoom: document.getElementById('btnCancelJoinRoom'),
    joinRoomError: document.getElementById('joinRoomError'),
    btnCloseRoomModal: document.querySelectorAll('.btnCloseRoomModal'),

    // 修改用户昵称弹窗
    editNicknameModal: document.getElementById('editNicknameModal'),
    editNicknameForm: document.getElementById('editNicknameForm'),
    inputEditNickname: document.getElementById('inputEditNickname'),
    btnCancelEditNickname: document.getElementById('btnCancelEditNickname'),
    btnCloseEditNicknameModal: document.getElementById('btnCloseEditNicknameModal'),
    editNicknameError: document.getElementById('editNicknameError'),

    // 修改活动专属昵称弹窗
    editRoomNicknameModal: document.getElementById('editRoomNicknameModal'),
    editRoomNicknameForm: document.getElementById('editRoomNicknameForm'),
    inputEditRoomNickname: document.getElementById('inputEditRoomNickname'),
    btnCancelEditRoomNickname: document.getElementById('btnCancelEditRoomNickname'),
    editRoomNicknameError: document.getElementById('editRoomNicknameError'),

    // 修改活动名称弹窗
    editRoomTitleModal: document.getElementById('editRoomTitleModal'),
    editRoomTitleForm: document.getElementById('editRoomTitleForm'),
    inputEditRoomTitle: document.getElementById('inputEditRoomTitle'),
    btnCancelEditRoomTitle: document.getElementById('btnCancelEditRoomTitle'),
    editRoomTitleError: document.getElementById('editRoomTitleError'),

    // 专属分享邀请卡片
    shareModal: document.getElementById('shareModal'),
    btnCloseShareModal: document.getElementById('btnCloseShareModal'),
    shareCardRoomTitle: document.getElementById('shareCardRoomTitle'),
    shareCardInviter: document.getElementById('shareCardInviter'),
    shareCardRoomCode: document.getElementById('shareCardRoomCode'),
    shareQrCanvas: document.getElementById('shareQrCanvas'),
    inputShareDirectUrl: document.getElementById('inputShareDirectUrl'),
    btnCopyShareDirectUrl: document.getElementById('btnCopyShareDirectUrl'),
    btnCopyCompleteInvite: document.getElementById('btnCopyCompleteInvite'),
    btnNativeShare: document.getElementById('btnNativeShare'),
    authInviteHint: document.getElementById('authInviteHint'),

    toast: document.getElementById('toast')
  };

  // Toast 提示 (增强显隐状态管理，确保定时消失)
  let toastTimer = null;
  function showToast(msg) {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    dom.toast.textContent = msg;
    dom.toast.classList.remove('hidden');
    toastTimer = setTimeout(() => {
      dom.toast.classList.add('hidden');
      dom.toast.textContent = '';
      toastTimer = null;
    }, 2000);
  }

  // 全平台/多端剪贴板通用复制（兼容非安全 HTTP、HTTPS、微信内置浏览器与各类移动端 WebView）
  async function copyTextToClipboard(text) {
    if (!text) return false;

    // 1. 若处于安全上下文 (HTTPS 或 localhost)，优先使用系统 clipboard API
    if (window.isSecureContext && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('navigator.clipboard.writeText 写入失败，转入降级方案:', err);
      }
    }

    // 2. 降级方案：创建临时隐藏 textarea 并使用 execCommand('copy')
    // 广泛支持 HTTP 独立域名、局域网 IP 与微信等环境
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      // 设置固定定位并置于可视区域外，避免移动端页面抖动或键盘弹出
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '-9999px';
      textarea.style.width = '2em';
      textarea.style.height = '2em';
      textarea.style.padding = '0';
      textarea.style.border = 'none';
      textarea.style.outline = 'none';
      textarea.style.boxShadow = 'none';
      textarea.style.background = 'transparent';
      textarea.setAttribute('readonly', '');

      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, text.length);

      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (successful) return true;
    } catch (err) {
      console.warn('execCommand 失败:', err);
    }

    return false;
  }

  // 增强横向滑动交互：支持鼠标按住抓取平滑拖拽 + 智能滚轮联动（绝不干扰内部纵向物品列表滚动）
  function enableHorizontalDragScroll(el) {
    if (!el || el.__dragScrollEnabled) return;
    el.__dragScrollEnabled = true;

    let isDown = false;
    let startX = 0;
    let startY = 0;
    let scrollStart = 0;
    let isDraggingHorizontally = false;
    let rafId = null;

    el.addEventListener('mousedown', (e) => {
      // 仅响应鼠标主键（左键）
      if (e.button !== 0) return;
      // 按钮、链接、输入框等可交互元素不触发拖拽
      if (e.target.closest('button, input, a, select, textarea, .rec-checkbox')) return;
      isDown = true;
      isDraggingHorizontally = false;
      startX = e.pageX;
      startY = e.pageY;
      scrollStart = el.scrollLeft;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const dx = e.pageX - startX;
      const dy = e.pageY - startY;

      // 判定滑动方向：如果横向位移显著大于纵向位移，且位移大于5px，判定为横向拖拽
      if (!isDraggingHorizontally) {
        if (Math.abs(dx) > 5 && Math.abs(dx) >= Math.abs(dy)) {
          isDraggingHorizontally = true;
          el.style.cursor = 'grabbing';
          document.body.style.userSelect = 'none';
          document.body.style.webkitUserSelect = 'none';
        } else if (Math.abs(dy) > 5 && Math.abs(dy) > Math.abs(dx)) {
          // 纵向滑动意图明显，取消当前横向拖拽状态，让纵向自然响应
          isDown = false;
          return;
        }
      }

      if (isDraggingHorizontally) {
        e.preventDefault();
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          el.scrollLeft = scrollStart - dx;
        });
      }
    });

    const stopDrag = () => {
      if (isDown || isDraggingHorizontally) {
        isDown = false;
        if (isDraggingHorizontally) {
          el.style.cursor = '';
          document.body.style.userSelect = '';
          document.body.style.webkitUserSelect = '';
          // 延时清除拖拽标记，避免松开鼠标时误触发子元素的点击事件
          setTimeout(() => {
            isDraggingHorizontally = false;
          }, 80);
        }
      }
    };

    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('mouseleave', stopDrag);

    // 捕获阶段拦截点击事件：如果发生了明显横向拖拽，阻止默认点击和冒泡
    el.addEventListener('click', (e) => {
      if (isDraggingHorizontally) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);

    // 智能滚轮事件处理：
    // 关键修复：如果在成员纵向清单列表（.other-items-box）内滚动滚轮，绝对不要拦截或转为横向滚动！
    el.addEventListener('wheel', (e) => {
      // 1. 如果光标位于纵向滚动子容器（如 .other-items-box）内
      const verticalBox = e.target.closest('.other-items-box, .items-scroll-box, .summary-grid');
      if (verticalBox) {
        // 如果是纵向滚轮（deltaY 为主且未按 Shift），完全放行让浏览器原生顺畅纵向滚动
        if (Math.abs(e.deltaY) >= Math.abs(e.deltaX) && !e.shiftKey) {
          return;
        }
      }

      // 2. 如果是原生横向滚轮（触控板横滑、带横向滚轮的鼠标）
      if (Math.abs(e.deltaX) > 0 && Math.abs(e.deltaX) >= Math.abs(e.deltaY)) {
        // 浏览器原生已支持 overflow-x: auto，直接放行原生横向平滑滚动
        return;
      }

      // 3. 在非纵向列表区域（如列头部、空隙、标签栏），将普通纵向鼠标滚轮转换为横向滚动
      if (Math.abs(e.deltaY) > 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }

  // ==========================================
  // 前端中文模糊语义归一化与相似度检测模块
  // ==========================================
  const PREFIXES = [
    '冰镇', '冰冻', '冷藏', '常温', '温热', '现烤', '自制', '现切', '新鲜', '纯正',
    '大号', '中号', '小号', '超大', '加大', '特大', '加厚', '特厚', '加长',
    '便携式', '便携', '折叠式', '折叠', '迷你', '双人', '单人', '大桶',
    '一次性', '露营', '户外', '野餐', '野营', '家用',
    '无糖', '零度', '低糖', '原味', '精酿', '鲜榨', '微糖', '加糖',
    '瓶装', '罐装', '听装', '箱装', '袋装', '盒装', '桶装',
    '烤', '煮', '卤'
  ];

  const SUFFIXES = [
    '一箱', '一提', '一袋', '一包', '一盒', '一瓶', '一听', '一桶',
    '1箱', '1提', '1袋', '1包', '1盒', '1瓶', '1听', '1桶'
  ];

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

  function extractStem(name) {
    let res = (name || '').trim();
    if (!res) return '';
    res = res.replace(/[\(（][^\)）]+[\)）]/g, '').trim();
    res = res.replace(/(.{2,})\1+$/g, '$1');
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
    res = res.replace(/(.{2,})\1+$/g, '$1');
    return res.toLowerCase().trim();
  }

  function matchSynonymCore(stem) {
    if (!stem) return null;
    for (const syn of CORE_SYNONYMS) {
      for (const k of syn.keywords) {
        const lowerK = k.toLowerCase();
        if (stem === lowerK) return syn.core;
        if (lowerK.length >= 2 && (stem.endsWith(lowerK) || stem.includes(lowerK))) {
          return syn.core;
        }
      }
    }
    return null;
  }

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

  function compareSemantic(nameA, nameB) {
    const cleanA = (nameA || '').trim();
    const cleanB = (nameB || '').trim();
    if (!cleanA || !cleanB) return { isMatch: false, level: null, reason: '' };

    if (cleanA.toLowerCase() === cleanB.toLowerCase()) {
      return { isMatch: true, level: 'EXACT', reason: '完全同名' };
    }

    if (isPureStutter(cleanA, cleanB)) {
      return { isMatch: true, level: 'STUTTER', reason: '叠词输入重复' };
    }

    const stemA = extractStem(cleanA);
    const stemB = extractStem(cleanB);
    const infoA = getSemanticInfo(cleanA);
    const infoB = getSemanticInfo(cleanB);

    if (infoA.core === infoB.core) {
      return { isMatch: true, level: 'SIMILAR', reason: `同属【${infoA.core}】品类物资` };
    }

    if (stemA === stemB) {
      return { isMatch: true, level: 'SIMILAR', reason: `核心均为【${stemA}】同类物资` };
    }

    if (stemA.length >= 2 && stemB.length >= 2) {
      if (stemA.endsWith(stemB) || stemB.endsWith(stemA)) {
        const shorter = stemA.length <= stemB.length ? stemA : stemB;
        return { isMatch: true, level: 'SIMILAR', reason: `同属【${shorter}】同类物资` };
      }
    }

    return { isMatch: false, level: null, reason: '' };
  }

  // 快速定位并高亮清单中的已有重复或相似物品 (type: 'duplicate' | 'similar')
  function locateAndHighlightMyItem(name, type = 'duplicate') {
    if (!dom.myItemsList || !name) return false;
    const clean = name.trim().toLowerCase();
    
    // 查找目标卡片（先按完全匹配找，找不到按语义核心找）
    const cards = Array.from(dom.myItemsList.querySelectorAll('.my-item-card'));
    let targetCard = cards.find(card => {
      const cardName = (card.getAttribute('data-name') || '').trim().toLowerCase();
      return cardName === clean;
    });

    if (!targetCard) {
      const targetInfo = getSemanticInfo(clean);
      targetCard = cards.find(card => {
        const cardName = (card.getAttribute('data-name') || '').trim().toLowerCase();
        const cardInfo = getSemanticInfo(cardName);
        return cardInfo.core === targetInfo.core || compareSemantic(clean, cardName).isMatch;
      });
    }

    if (!targetCard) return false;

    // 1. 平滑滚动定位至可视区域中央
    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 2. 清除可能残留的旧高亮类
    cards.forEach(c => {
      c.classList.remove('item-highlight-duplicate');
      c.classList.remove('item-highlight-similar');
    });
    
    // 3. 强制重绘，确保连续多次输入同名物品时均能重新触发动效
    void targetCard.offsetWidth;

    // 4. 注入强醒目高亮动效（完全重复使用红色震颤，相似提醒使用温和金橙色呼吸）
    const highlightClass = type === 'similar' ? 'item-highlight-similar' : 'item-highlight-duplicate';
    targetCard.classList.add(highlightClass);

    // 5. 动画完成后平滑恢复
    setTimeout(() => {
      targetCard.classList.remove(highlightClass);
    }, 2800);

    return true;
  }

  // 核心免输码自动进房处理
  async function handleAutoJoinPendingRoom(code) {
    if (!code) return;
    try {
      const res = await Api.joinRoom(code);
      sessionStorage.removeItem('pending_invite_code');
      // 清理 URL 上的参数，保持地址栏干净
      window.history.replaceState({}, document.title, window.location.pathname);

      state.currentRoomId = res.room.id;
      Api.setCurrentRoomId(res.room.id);
      showToast(`🎉 欢迎！已免输码自动进入【${res.room.title}】`);
      await loadBoardData();
    } catch (err) {
      console.warn('Auto join room error:', err);
      sessionStorage.removeItem('pending_invite_code');
      window.history.replaceState({}, document.title, window.location.pathname);
      showToast(err.message || '邀请码无效或活动不存在');
      await loadBoardData();
    }
  }

  // 专属分享邀请的基准域名 (按用户指定域名 http://luying.22182214.xyz 生成)
  const DEFAULT_INVITE_DOMAIN = 'http://luying.22182214.xyz';

  // 生成专属免输码直达邀请链接 (固定按 http://luying.22182214.xyz 域名生成)
  function getDirectInviteUrl(roomCode) {
    const code = roomCode || state.currentRoom?.code || '';
    // 优先采用配置的邀请基准域名（支持服务端 PUBLIC_URL 环境变量，默认 http://luying.22182214.xyz）
    const base = state.systemInfo?.inviteBaseUrl || DEFAULT_INVITE_DOMAIN;
    const cleanBase = base.replace(/\/+$/, '');
    return `${cleanBase}/?code=${encodeURIComponent(code)}`;
  }

  // 打开微信/网页专属分享邀请卡片
  function openShareModal() {
    if (!state.currentRoom) return;
    if (state.currentRoom.is_archived) {
      showToast('该活动已归档，邀请码已释放，无法分享邀请好友');
      return;
    }

    const directUrl = getDirectInviteUrl(state.currentRoom.code);
    const myDisplayName = state.boardData?.currentUser?.display_name || state.boardData?.currentUser?.nickname || state.currentUser?.nickname;
    const inviterName = cleanNickname(myDisplayName) || '好友';

    dom.shareCardRoomTitle.textContent = state.currentRoom.title;
    dom.shareCardInviter.textContent = inviterName;
    dom.shareCardRoomCode.textContent = state.currentRoom.code;
    dom.inputShareDirectUrl.value = directUrl;

    // 动态生成高清二维码 (朋友面对面微信扫一扫秒进)
    if (window.QRious && dom.shareQrCanvas) {
      try {
        new QRious({
          element: dom.shareQrCanvas,
          value: directUrl,
          size: 130,
          level: 'H',
          foreground: '#065F46',
          background: '#FFFFFF'
        });
      } catch (err) {
        console.warn('QR generate error:', err);
      }
    }

    // 检查是否支持系统/微信原生分享菜单 (Web Share API)
    if (navigator.share) {
      dom.btnNativeShare.classList.remove('hidden');
    } else {
      dom.btnNativeShare.classList.add('hidden');
    }

    dom.shareModal.classList.remove('hidden');
  }

  // 复制完整微信邀请卡片文案
  async function handleCopyCompleteInvite() {
    if (!state.currentRoom) return;
    if (state.currentRoom.is_archived) {
      showToast('该活动已归档，邀请码已释放');
      return;
    }
    const directUrl = getDirectInviteUrl(state.currentRoom.code);
    const myDisplayName = state.boardData?.currentUser?.display_name || state.boardData?.currentUser?.nickname || state.currentUser?.nickname;
    const inviter = cleanNickname(myDisplayName) || '好友';
    const text = `🏕️【露营物资助手】露营物资协同邀请
活动：“${state.currentRoom.title}”
邀请人：${inviter}
邀请码：${state.currentRoom.code}
👉 点此链接免输邀请码直接进房：
${directUrl}`;

    const ok = await copyTextToClipboard(text);
    if (ok) {
      showToast('🎉 完整微信邀请卡片已复制，去群里粘贴吧！');
      if (dom.btnCopyCompleteInvite) {
        const origHtml = dom.btnCopyCompleteInvite.innerHTML;
        dom.btnCopyCompleteInvite.innerHTML = '✅ 微信邀请文案已复制到剪贴板！';
        dom.btnCopyCompleteInvite.classList.add('btn-copied-primary');
        setTimeout(() => {
          dom.btnCopyCompleteInvite.innerHTML = origHtml;
          dom.btnCopyCompleteInvite.classList.remove('btn-copied-primary');
        }, 1800);
      }
    } else {
      // 若受限则全选直达链接框方便直接长按复制
      if (dom.inputShareDirectUrl) {
        dom.inputShareDirectUrl.value = directUrl;
        dom.inputShareDirectUrl.focus();
        dom.inputShareDirectUrl.select();
        dom.inputShareDirectUrl.setSelectionRange(0, directUrl.length);
      }
      showToast('已选中直达链接，请长按选择【复制】');
    }
  }

  // 唤起原生系统/微信分享
  async function handleNativeShare() {
    if (!navigator.share || !state.currentRoom) return;
    if (state.currentRoom.is_archived) return;
    const directUrl = getDirectInviteUrl(state.currentRoom.code);
    const myDisplayName = state.boardData?.currentUser?.display_name || state.boardData?.currentUser?.nickname || state.currentUser?.nickname;
    const inviter = cleanNickname(myDisplayName) || '好友';
    try {
      await navigator.share({
        title: `【露营物资助手】${state.currentRoom.title}`,
        text: `${inviter} 邀请你加入“${state.currentRoom.title}”，点开即可协同准备物资：`,
        url: directUrl
      });
    } catch (e) {
      // 用户取消分享
    }
  }

  // 初始化入口
  async function init() {
    bindEvents();

    // 0. 读取系统网络信息（供局域网分享链接使用）
    try {
      const sys = await Api.getSystemInfo();
      state.systemInfo = sys;
      const hint = document.getElementById('networkHint');
      if (hint && sys.mobileUrl) {
        hint.innerHTML = `📲 手机同WiFi访问: <a href="${sys.mobileUrl}" target="_blank" style="color:#059669; font-weight:bold; text-decoration:underline;">${sys.mobileUrl}</a>`;
      }
    } catch (e) {
      console.warn(e);
    }

    // 1. 检查 URL 中是否有专属免输码直达邀请参数 (?code=xxxxxx 或 ?room=xxxxxx 或 ?join=xxxxxx)
    const urlParams = new URLSearchParams(window.location.search);
    const incomingCode = (urlParams.get('code') || urlParams.get('join') || urlParams.get('room') || '').trim();
    if (incomingCode && /^\d{6}$/.test(incomingCode)) {
      sessionStorage.setItem('pending_invite_code', incomingCode);
    }

    // 2. 检查本地登录状态，新用户或未登录用户直接弹出账号密码登录页面
    const token = Api.getToken();
    if (token) {
      try {
        const res = await Api.getMe();
        state.currentUser = res.user;
      } catch (e) {
        Api.setToken(null);
        state.currentUser = null;
      }
    }

    // 3. 若未登录，直接打开账号密码登录界面（支持切换注册，注册后直接登录成功）
    if (!state.currentUser) {
      openAuthModal('login');
      return;
    }

    // 4. 若已登录，检查是否有待免输码自动进入的房间
    const pendingCode = sessionStorage.getItem('pending_invite_code');
    if (pendingCode) {
      await handleAutoJoinPendingRoom(pendingCode);
    } else {
      await loadBoardData();
    }

    connectRoomStream();
    await loadTemplates();
  }

  // 实时推送通道与新增动效状态
  let currentEventSource = null;
  let sseReconnectTimer = null;
  let backgroundPollTimer = null;
  let knownItemIds = new Set();
  let newlyArrivedItemIds = new Set();
  let liveNoticeTimer = null;
  let isUserTouchingScreen = false;
  let pendingSilentUpdate = null;

  window.addEventListener('touchstart', () => {
    isUserTouchingScreen = true;
  }, { passive: true });

  const handleTouchRelease = () => {
    isUserTouchingScreen = false;
    if (pendingSilentUpdate) {
      const fn = pendingSilentUpdate;
      pendingSilentUpdate = null;
      fn();
    }
  };
  window.addEventListener('touchend', handleTouchRelease, { passive: true });
  window.addEventListener('touchcancel', handleTouchRelease, { passive: true });

  // 计算协同看板的数据签名（用于比对数据是否实际发生变化）
  function computeBoardSignature(data) {
    if (!data) return '';
    const mySig = (data.myItems || []).map(i => `${i.id}:${i.quantity}:${i.is_checked}:${i.name}`).join('|');
    const othersSig = (data.othersItems || []).map(c => 
      `${c.user.id}:${c.user.nickname}:${c.user.display_name || ''}:` + (c.items || []).map(i => `${i.id}:${i.quantity}:${i.is_checked}:${i.name}`).join(',')
    ).join('||');
    const summarySig = (data.summaryList || []).map(s => `${s.name}:${s.totalQuantity}:${s.isDuplicate}:${s.allChecked}`).join('|');
    const roomSig = `${data.room?.id}:${data.room?.title}:${data.room?.is_archived}:${data.room?.code}`;
    const userSig = `${data.currentUser?.id}:${data.currentUser?.display_name || ''}:${data.currentUser?.nickname || ''}`;
    return `${roomSig}#${userSig}#${mySig}#${othersSig}#${summarySig}`;
  }

  // 更新实时协同状态徽章
  function updateSyncStatus(status) {
    if (!dom.syncStatusBadge) return;
    dom.syncStatusBadge.className = `sync-status-badge ${status}`;
    const textEl = dom.syncStatusBadge.querySelector('.sync-text');
    if (textEl) {
      if (status === 'connected') {
        textEl.textContent = '实时协同中';
      } else if (status === 'connecting') {
        textEl.textContent = '连线中...';
      } else {
        textEl.textContent = '重连中...';
      }
    }
  }

  // 弹出顶部灵动浮层横幅提醒 (好友在另一台手机操作时优雅跳出)
  function showLiveNotice(message, action) {
    if (!dom.liveNoticeBanner || !dom.liveNoticeText) return;
    if (liveNoticeTimer) {
      clearTimeout(liveNoticeTimer);
      liveNoticeTimer = null;
    }

    let icon = '⚡';
    if (action === 'item_added') icon = '🎒';
    else if (action === 'batch_imported') icon = '📦';
    else if (action === 'item_checked') icon = '✅';
    else if (action === 'item_deleted') icon = '🗑️';
    else if (action === 'item_edited') icon = '✏️';
    else if (action === 'member_joined') icon = '👋';

    const iconEl = dom.liveNoticeBanner.querySelector('.live-notice-icon');
    if (iconEl) iconEl.textContent = icon;
    dom.liveNoticeText.textContent = message;

    dom.liveNoticeBanner.classList.remove('hidden');
    dom.liveNoticeBanner.classList.remove('banner-slide-out');
    dom.liveNoticeBanner.classList.add('banner-slide-in');

    if ('vibrate' in navigator) {
      try { navigator.vibrate(40); } catch (e) {}
    }

    liveNoticeTimer = setTimeout(() => {
      dom.liveNoticeBanner.classList.remove('banner-slide-in');
      dom.liveNoticeBanner.classList.add('banner-slide-out');
      setTimeout(() => {
        dom.liveNoticeBanner.classList.add('hidden');
        dom.liveNoticeBanner.classList.remove('banner-slide-out');
        liveNoticeTimer = null;
      }, 300);
    }, 3200);
  }

  // 建立 SSE 实时推送通道 (双保险：SSE即时推送 + 3.5秒轻量智能轮询兜底)
  function connectRoomStream() {
    if (currentEventSource) {
      try {
        currentEventSource.close();
      } catch (e) {}
      currentEventSource = null;
    }
    if (sseReconnectTimer) {
      clearTimeout(sseReconnectTimer);
      sseReconnectTimer = null;
    }

    const roomId = state.currentRoomId;
    if (!roomId || !state.currentUser) return;

    const streamUrl = Api.getStreamUrl(roomId);
    updateSyncStatus('connecting');

    try {
      currentEventSource = new EventSource(streamUrl);

      currentEventSource.addEventListener('connected', () => {
        updateSyncStatus('connected');
        // 连接建立或重连恢复后，立即拉取一次最新看板，确保断连期间不遗漏任何新成员与变动
        loadBoardData(true);
      });

      currentEventSource.addEventListener('board_updated', async (e) => {
        try {
          const payload = JSON.parse(e.data);
          const isByMe = payload.operator && state.currentUser && String(payload.operator.id) === String(state.currentUser.id);

          // 重新静默拉取最新数据，触发动态高亮与成员重绘
          await loadBoardData(true);

          // 好友操作时在屏幕顶端弹出横幅
          if (!isByMe && payload.message) {
            showLiveNotice(payload.message, payload.action);
          }
        } catch (err) {
          console.error('SSE board_updated parse error:', err);
        }
      });

      currentEventSource.onerror = () => {
        updateSyncStatus('disconnected');
        // 网络波动或代理断开时，3秒后主动重连
        if (!sseReconnectTimer) {
          sseReconnectTimer = setTimeout(() => {
            sseReconnectTimer = null;
            if (state.currentRoomId && state.currentUser) {
              connectRoomStream();
            }
          }, 3000);
        }
      };
    } catch (e) {
      console.error('Failed to init EventSource:', e);
      updateSyncStatus('disconnected');
    }

    // 启动智能轮询兜底（针对反向代理缓冲、手机休眠等弱网场景保障）
    startSmartPolling();
  }

  // 启动后台智能轻量同步轮询（兜底机制：SQLite毫秒级查询，确保数据100%一致）
  function startSmartPolling() {
    if (backgroundPollTimer) return;
    backgroundPollTimer = setInterval(async () => {
      if (state.currentUser && state.currentRoomId && document.visibilityState === 'visible') {
        try {
          await loadBoardData(true);
        } catch (e) {
          // 静默容错
        }
      }
    }, 3500);
  }

  // 应用并渲染协同看板数据
  function applyBoardData(data) {
    // 跟踪比对出新增的物资条目，用于呈现“实时跳出”弹性进场动效
    const currentIds = new Set();
    data.myItems.forEach(i => currentIds.add(i.id));
    data.othersItems.forEach(col => col.items.forEach(i => currentIds.add(i.id)));

    newlyArrivedItemIds.clear();
    if (knownItemIds.size > 0) {
      currentIds.forEach(id => {
        if (!knownItemIds.has(id)) {
          newlyArrivedItemIds.add(id);
        }
      });
    }
    knownItemIds = currentIds;

    state.boardData = data;
    state.currentRoom = data.room;

    renderHeader();
    renderHomeBoard();
    renderChecklist();
    renderProfile();
    renderTemplates();

    // 动效高亮持续1.2秒后恢复
    if (newlyArrivedItemIds.size > 0) {
      setTimeout(() => {
        newlyArrivedItemIds.clear();
        document.querySelectorAll('.item-bounce-enter').forEach(el => el.classList.remove('item-bounce-enter'));
      }, 1200);
    }
  }

  // 加载协同看板数据 (支持 silent 静默模式)
  async function loadBoardData(silent = false) {
    if (!state.currentUser) return;
    try {
      const data = await Api.getBoard(state.currentRoomId);

      // 计算数据签名比对
      const newSignature = computeBoardSignature(data);
      const hasDataChanged = (state.lastBoardSignature !== newSignature);
      state.lastBoardSignature = newSignature;

      // 如果是后台静默轮询更新，且数据毫无变化，直接跳过重绘，避免打扰用户当前浏览与滚动
      if (silent && !hasDataChanged) {
        return;
      }

      // 如果用户当前手指正按在手机屏幕上滑动或长按，暂存静默更新等手指离屏 (touchend) 再重绘，绝不中途打断手势
      if (silent && isUserTouchingScreen) {
        pendingSilentUpdate = () => {
          applyBoardData(data);
        };
        return;
      }

      applyBoardData(data);
    } catch (err) {
      if (!silent) {
        showToast(err.message || '加载活动数据失败');
      }
    }
  }

  // 渲染顶部导航条
  function renderHeader() {
    if (!state.currentRoom) return;
    if (state.currentRoom.is_archived) {
      dom.currentRoomCode.textContent = '已归档 (码已释放)';
    } else {
      dom.currentRoomCode.textContent = `邀请码：${state.currentRoom.code}`;
    }
    dom.currentRoomTitle.textContent = state.currentRoom.title;
  }

  // 渲染首页协同看板 (手绘还原关键)
  function renderHomeBoard() {
    if (!state.boardData) return;
    const { myItems, othersItems, summaryList } = state.boardData;
    const isArchived = Boolean(state.boardData?.room?.is_archived);

    // 0. 保护所有滚动容器的位置：外层横向滑动位置 + 每个成员清单内的纵向滚动位置 + 我的清单滚动位置 + 最终汇总滚动位置
    const savedOthersScrollLeft = dom.othersColumnsScroll ? dom.othersColumnsScroll.scrollLeft : 0;
    const savedUserScrollTops = new Map();
    if (dom.othersColumnsScroll) {
      dom.othersColumnsScroll.querySelectorAll('.other-user-col').forEach(colEl => {
        const uid = colEl.getAttribute('data-user-id');
        const box = colEl.querySelector('.other-items-box');
        if (uid && box) {
          savedUserScrollTops.set(String(uid), box.scrollTop);
        }
      });
    }
    const savedMyScrollTop = dom.myItemsList ? dom.myItemsList.scrollTop : 0;
    const savedSummaryScrollTop = dom.summaryItemsGrid ? dom.summaryItemsGrid.scrollTop : 0;

    // 0.1 活动归档状态处理 (只读模式控制)
    if (dom.archivedNoticeBanner) {
      dom.archivedNoticeBanner.classList.toggle('hidden', !isArchived);
    }
    const quickAddBar = dom.inputQuickAdd ? dom.inputQuickAdd.closest('.my-quick-add-bar') : null;
    if (quickAddBar) {
      quickAddBar.style.display = isArchived ? 'none' : 'flex';
    }

    // 1. 我的清单 (左列)
    dom.myCountBadge.textContent = myItems.length;
    const myDisplayName = state.boardData?.currentUser?.display_name || state.boardData?.currentUser?.nickname || state.currentUser?.nickname;
    if (dom.myColTitle && state.currentUser) {
      dom.myColTitle.textContent = cleanNickname(myDisplayName);
      dom.myColTitle.title = `专属昵称: ${cleanNickname(myDisplayName)} (点击✏️可修改)`;
    }
    const myTheme = state.boardData?.currentUser?.theme || state.currentUser?.theme || state.currentUser?.colorTheme;
    if (myTheme) {
      dom.myAvatarDot.style.background = myTheme.badge;
      dom.myCountBadge.style.backgroundColor = myTheme.cardBg;
      dom.myCountBadge.style.color = myTheme.badge;
      if (dom.myListColumn) {
        dom.myListColumn.style.backgroundColor = myTheme.bg;
        dom.myListColumn.style.borderRightColor = myTheme.border;
      }
      if (dom.myColHeader) {
        dom.myColHeader.style.backgroundColor = myTheme.cardBg;
        dom.myColHeader.style.borderBottomColor = myTheme.border;
      }
      if (dom.myColTitle) {
        dom.myColTitle.style.color = myTheme.text;
      }
      if (dom.myMeTag) {
        dom.myMeTag.style.color = myTheme.badge;
        dom.myMeTag.style.backgroundColor = myTheme.cardBg;
        dom.myMeTag.style.border = `1px solid ${myTheme.border}`;
      }
    }

    if (myItems.length === 0) {
      dom.myItemsList.innerHTML = `
        <div class="empty-placeholder">
          <span>🎒</span>
          <span>暂无物资</span>
          <span style="font-size:10px;">${isArchived ? '活动已归档（只读）' : '在下方添加或从推荐库挑选'}</span>
        </div>
      `;
    } else {
      dom.myItemsList.innerHTML = myItems.map(item => `
        <div class="my-item-card ${newlyArrivedItemIds.has(item.id) ? 'item-bounce-enter' : ''}" data-id="${item.id}" data-name="${escapeHtml(item.name)}" data-quantity="${item.quantity}">
          <span class="item-name-text">${escapeHtml(item.name)}</span>
          <span class="item-qty-tag" style="background:${myTheme?.cardBg || '#E8F5E9'}; color:${myTheme?.badge || '#059669'};">×${item.quantity}</span>
        </div>
      `).join('');
    }

    // 2. 其他人清单 (右列横向滚动)
    if (dom.othersCountBadge) {
      dom.othersCountBadge.textContent = `${othersItems.length}人`;
    }

    const isRoomCreator = Boolean(state.boardData?.room?.is_creator || (state.currentUser && Number(state.boardData?.room?.creator_id) === Number(state.currentUser.id)));

    if (othersItems.length === 0) {
      dom.othersColumnsScroll.innerHTML = `
        <div class="empty-placeholder" style="width: 100%;">
          <span>👥</span>
          <span>还没有其他小伙伴加入</span>
          <span style="font-size:10px;">复制房间码发给朋友一起选</span>
        </div>
      `;
    } else {
      dom.othersColumnsScroll.innerHTML = othersItems.map(col => {
        const user = col.user;
        const theme = user.theme;
        const items = col.items;

        return `
          <div class="other-user-col" data-user-id="${user.id}" style="background-color: ${theme.bg}; border-color: ${theme.border};">
            <div class="other-col-header" style="background-color: ${theme.cardBg}; border-color: ${theme.border};">
              <span class="other-col-name" style="color: ${theme.text};" title="${escapeHtml(user.nickname)}">${escapeHtml(user.nickname)}</span>
              <div class="other-col-actions">
                <span class="other-col-badge" style="color: ${theme.badge};">${items.length}件</span>
                ${isRoomCreator ? `
                  <button class="btn-purge-user-list" data-user-id="${user.id}" data-user-name="${escapeHtml(user.nickname)}" title="清除此人清单并移出活动" aria-label="移除此人">🗑️</button>
                ` : ''}
              </div>
            </div>
            <div class="other-items-box">
              ${items.length === 0 ? `
                <div class="empty-placeholder" style="padding:15px 0;">
                  <span style="font-size:10px; color:${theme.text}; opacity:0.6;">暂未添加</span>
                </div>
              ` : items.map(it => `
                <div class="other-item-card ${newlyArrivedItemIds.has(it.id) ? 'item-bounce-enter' : ''}" style="border-left: 3px solid ${theme.badge};">
                  <span class="other-item-name">${escapeHtml(it.name)}</span>
                  <span class="other-item-qty" style="color:${theme.badge};">×${it.quantity}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('');
    }

    // 3. 最终汇总清单 (下半区)
    const duplicateCount = summaryList.filter(s => s.isDuplicate).length;
    dom.summaryDuplicateStats.textContent = duplicateCount > 0 ? `⚠️ ${duplicateCount} 项重复` : `✨ 暂无重复`;
    dom.summaryTotalStats.textContent = `共 ${summaryList.length} 项`;

    if (summaryList.length === 0) {
      dom.summaryItemsGrid.innerHTML = `
        <div class="empty-placeholder" style="grid-column: 1 / -1; padding: 30px;">
          <span>📋</span>
          <span>准备的物资将在这里汇总结算</span>
        </div>
      `;
    } else {
      dom.summaryItemsGrid.innerHTML = summaryList.map((entry, index) => {
        const isDup = entry.isDuplicate;
        return `
          <div class="summary-card ${isDup ? 'is-duplicate' : ''}" data-index="${index}">
            ${isDup ? `<span class="duplicate-badge">${entry.duplicateCount > 1 ? `${entry.duplicateCount}人重复` : '重复'}</span>` : ''}
            <div class="summary-card-name" title="${escapeHtml(entry.name)}">${escapeHtml(entry.name)}</div>
            <div class="summary-card-bottom">
              <span class="summary-qty-label">总数: ×${entry.totalQuantity}</span>
              <div class="contributors-dots-row">
                ${entry.contributors.slice(0, 10).map(c => `
                  <span class="contributor-color-dot" style="background:${c.colorTheme.badge};" title="${escapeHtml(cleanNickname(c.nickname))} 带了 ${escapeHtml(c.namesText || entry.name)} ×${c.quantity}"></span>
                `).join('')}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 4. 精确还原各容器滚动位置，杜绝任何跳回顶部/页面抖动现象
    if (dom.othersColumnsScroll) {
      dom.othersColumnsScroll.scrollLeft = savedOthersScrollLeft;
      dom.othersColumnsScroll.querySelectorAll('.other-user-col').forEach(colEl => {
        const uid = colEl.getAttribute('data-user-id');
        const box = colEl.querySelector('.other-items-box');
        if (uid && box && savedUserScrollTops.has(String(uid))) {
          box.scrollTop = savedUserScrollTops.get(String(uid));
        }
      });
    }
    if (dom.myItemsList) {
      dom.myItemsList.scrollTop = savedMyScrollTop;
    }
    if (dom.summaryItemsGrid) {
      dom.summaryItemsGrid.scrollTop = savedSummaryScrollTop;
    }
  }

  // 加载推荐模板
  async function loadTemplates() {
    try {
      const res = await Api.getTemplates();
      state.templatesData = res;
      if (res.categories.length > 0 && !state.activeRecCategory) {
        state.activeRecCategory = res.categories[0].category;
      }
      renderTemplates();
    } catch (e) {
      console.error('Load templates error:', e);
    }
  }

  // 渲染推荐模板库
  function renderTemplates() {
    if (!state.templatesData) return;
    const { categories } = state.templatesData;

    // 渲染分类 Tabs
    dom.recommendCatTabs.innerHTML = categories.map(cat => `
      <button class="cat-tab-btn ${cat.category === state.activeRecCategory ? 'active' : ''}" data-category="${cat.category}">
        ${cat.category}
      </button>
    `).join('');

    // 确保激活分类平滑居中展露，避免边缘截断
    setTimeout(() => {
      if (dom.recommendCatTabs) {
        const activeCatBtn = dom.recommendCatTabs.querySelector('.cat-tab-btn.active');
        if (activeCatBtn) {
          activeCatBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    }, 50);

    // 获取当前分类项目
    const curCat = categories.find(c => c.category === state.activeRecCategory);
    const items = curCat ? curCat.items : [];

    // 获取我已有的物品列表（用于显示“已选”状态）
    const myItems = state.boardData?.myItems || [];
    const myItemNames = new Set(myItems.map(i => i.name.trim().toLowerCase()));

    // 检查并清理已被添加到个人清单中的已选缓存项，严防二次勾选
    const allTemplates = [];
    categories.forEach(c => allTemplates.push(...c.items));
    for (const selId of Array.from(state.selectedRecItems)) {
      const it = allTemplates.find(t => t.id === selId);
      if (it) {
        const alreadyIn = myItemNames.has(it.name.trim().toLowerCase()) ||
          myItems.some(mi => {
            const comp = compareSemantic(it.name, mi.name);
            return comp.isMatch && (comp.level === 'EXACT' || comp.level === 'STUTTER');
          });
        if (alreadyIn) {
          state.selectedRecItems.delete(selId);
        }
      }
    }

    dom.recommendList.innerHTML = items.map(item => {
      const isAlreadyInMy = myItemNames.has(item.name.trim().toLowerCase()) ||
        myItems.some(mi => {
          const comp = compareSemantic(item.name, mi.name);
          return comp.isMatch && (comp.level === 'EXACT' || comp.level === 'STUTTER');
        });

      if (isAlreadyInMy) {
        state.selectedRecItems.delete(item.id);
      }
      const isChecked = !isAlreadyInMy && state.selectedRecItems.has(item.id);

      return `
        <div class="rec-item-card ${isAlreadyInMy ? 'is-added' : ''}" data-id="${item.id}" data-name="${escapeHtml(item.name)}">
          <div class="rec-item-left">
            <input type="checkbox" class="rec-checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''} ${isAlreadyInMy ? 'disabled title="已在我的清单中，不可重复选择"' : ''}>
            <span class="rec-icon">${item.icon || '⛺'}</span>
            <div>
              <span class="rec-name">${escapeHtml(item.name)}</span>
              <span class="rec-unit">建议1${item.unit || '件'}</span>
            </div>
          </div>
          <button class="btn-add-rec ${isAlreadyInMy ? 'added' : ''}" data-id="${item.id}" data-name="${escapeHtml(item.name)}" ${isAlreadyInMy ? 'disabled title="已添加"' : ''}>
            ${isAlreadyInMy ? '✓ 已添加' : '+ 选它'}
          </button>
        </div>
      `;
    }).join('');

    updateBatchBar();
  }

  function updateBatchBar() {
    const count = state.selectedRecItems.size;
    dom.selectedRecCount.textContent = `已选 ${count} 项`;
    dom.btnBatchImport.disabled = count === 0;
  }

  // 渲染现场清点 Checklist（按用户分类，默认显示自己，展示 (4/5) 统计）
  function renderChecklist() {
    if (!state.boardData || !state.currentUser) return;
    const myItems = state.boardData.myItems || [];
    const others = state.boardData.othersItems || [];

    // 默认展示当前登录用户自己的待准备物资
    if (state.selectedChecklistUserId === null || state.selectedChecklistUserId === undefined) {
      state.selectedChecklistUserId = state.currentUser.id;
    }

    // 收集所有参与成员列表（优先取本活动内设置的专属自定义昵称）
    const myDisplayName = state.boardData?.currentUser?.display_name || state.boardData?.currentUser?.nickname || state.currentUser?.nickname;
    const myCleanName = cleanNickname(myDisplayName);
    const userCategories = [
      {
        id: state.currentUser.id,
        nickname: `${myCleanName} (我)`,
        pureNickname: myCleanName,
        isMe: true,
        theme: state.boardData?.currentUser?.theme || state.currentUser?.theme || state.currentUser?.colorTheme,
        items: myItems
      },
      ...others.map(col => {
        const cleanOther = cleanNickname(col.user.nickname);
        return {
          id: col.user.id,
          nickname: cleanOther,
          pureNickname: cleanOther,
          isMe: false,
          theme: col.user.theme,
          items: col.items
        };
      })
    ];

    // 全局汇总统计与每人单独统计
    let allTotal = 0;
    let allChecked = 0;
    userCategories.forEach(u => {
      const uTotal = u.items.length;
      const uChecked = u.items.filter(i => i.is_checked === 1).length;
      u.total = uTotal;
      u.checked = uChecked;
      u.isAllDone = uTotal > 0 && uChecked === uTotal;
      allTotal += uTotal;
      allChecked += uChecked;
    });

    const percent = allTotal > 0 ? Math.round((allChecked / allTotal) * 100) : 0;
    dom.checkProgressText.textContent = `全员已就绪 ${allChecked} / ${allTotal} 项 (${percent}%)`;
    dom.checkProgressBar.style.width = `${percent}%`;

    // 渲染用户分类标签栏
    const isAllSelected = state.selectedChecklistUserId === 'all';
    let tabsHtml = userCategories.map(u => {
      const isActive = !isAllSelected && String(state.selectedChecklistUserId) === String(u.id);
      return `
        <button class="check-user-tab-btn ${isActive ? 'active' : ''} ${u.isAllDone ? 'all-done' : ''}" data-uid="${u.id}">
          <span class="tab-user-name">${escapeHtml(u.nickname)}</span>
          ${renderRatioBadge(u.checked, u.total)}
        </button>
      `;
    }).join('');

    // 追加全员总览选项
    tabsHtml += `
      <button class="check-user-tab-btn ${isAllSelected ? 'active' : ''} ${allTotal > 0 && allChecked === allTotal ? 'all-done' : ''}" data-uid="all">
        <span class="tab-user-name">全员总览</span>
        ${renderRatioBadge(allChecked, allTotal)}
      </button>
    `;
    if (dom.checklistUserTabs) {
      dom.checklistUserTabs.innerHTML = tabsHtml;

      // 确保激活的用户分类标签平滑居中展露，左右滑动更跟手
      setTimeout(() => {
        const activeUserBtn = dom.checklistUserTabs.querySelector('.check-user-tab-btn.active');
        if (activeUserBtn) {
          activeUserBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 50);
    }

    // 确定当前视图要展示的物资列表
    let displayItems = [];
    let currentCategoryTitle = '';
    let isViewingOthers = false;

    if (isAllSelected) {
      currentCategoryTitle = '全员';
      userCategories.forEach(u => {
        u.items.forEach(it => {
          displayItems.push({
            ...it,
            ownerName: u.nickname,
            ownerTheme: u.theme,
            isMine: u.isMe
          });
        });
      });
    } else {
      const selectedUser = userCategories.find(u => String(u.id) === String(state.selectedChecklistUserId)) || userCategories[0];
      currentCategoryTitle = selectedUser.nickname;
      isViewingOthers = !selectedUser.isMe;
      selectedUser.items.forEach(it => {
        displayItems.push({
          ...it,
          ownerName: selectedUser.nickname,
          ownerTheme: selectedUser.theme,
          isMine: selectedUser.isMe
        });
      });
    }

    const pendingItems = displayItems.filter(i => i.is_checked !== 1);
    const doneItems = displayItems.filter(i => i.is_checked === 1);

    dom.checklistItemsContainer.innerHTML = `
      <div class="check-group">
        <div class="check-group-header">
          <span>📦 【${escapeHtml(currentCategoryTitle)}】待准备物资 (${pendingItems.length})</span>
          <span style="font-size:10px; color:#94A3B8; font-weight:normal; margin-left:auto;">
            ${isViewingOthers ? '（由对方负责）' : '（点击直接打钩装车）'}
          </span>
        </div>
        <div class="check-group-list">
          ${pendingItems.length === 0 ? `
            <div class="empty-placeholder" style="background:#FFF; border-radius:8px; padding:12px;">
              <span>🎉 太棒了！待准备物资已全部就绪</span>
            </div>
          ` : pendingItems.map(it => `
            <div class="check-item-row ${it.isMine ? 'is-mine' : 'is-others'} ${newlyArrivedItemIds.has(it.id) ? 'item-bounce-enter' : ''}" data-id="${it.id}" data-checked="0" data-mine="${it.isMine ? 'true' : 'false'}" data-owner="${escapeHtml(it.ownerName)}">
              <div class="check-item-left">
                <div class="check-circle ${it.isMine ? '' : 'check-circle-readonly'}">${it.isMine ? '✓' : '🔒'}</div>
                <span class="check-title">${escapeHtml(it.name)} ×${it.quantity}</span>
              </div>
              <span class="check-owner-tag" style="background:${it.ownerTheme?.cardBg || '#F1F5F9'}; color:${it.ownerTheme?.text || '#475569'}; border: 1px solid ${it.ownerTheme?.border || '#CBD5E1'};">
                ${escapeHtml(it.ownerName)}
              </span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="check-group">
        <div class="check-group-header">
          <span>✅ 【${escapeHtml(currentCategoryTitle)}】已就绪 / 装车 (${doneItems.length})</span>
        </div>
        <div class="check-group-list">
          ${doneItems.length === 0 ? `
            <div class="empty-placeholder" style="background:#FFF; border-radius:8px; padding:12px;">
              <span>尚未有已装车物资，请在上方打钩完成</span>
            </div>
          ` : doneItems.map(it => `
            <div class="check-item-row is-done ${it.isMine ? 'is-mine' : 'is-others'} ${newlyArrivedItemIds.has(it.id) ? 'item-bounce-enter' : ''}" data-id="${it.id}" data-checked="1" data-mine="${it.isMine ? 'true' : 'false'}" data-owner="${escapeHtml(it.ownerName)}">
              <div class="check-item-left">
                <div class="check-circle ${it.isMine ? '' : 'check-circle-readonly'}">✓</div>
                <span class="check-title">${escapeHtml(it.name)} ×${it.quantity}</span>
              </div>
              <span class="check-owner-tag" style="background:${it.ownerTheme?.cardBg || '#F1F5F9'}; color:${it.ownerTheme?.text || '#475569'}; border: 1px solid ${it.ownerTheme?.border || '#CBD5E1'};">
                ${escapeHtml(it.ownerName)}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 渲染“我的”页面
  async function renderProfile() {
    if (!state.currentUser) return;
    dom.profileNickname.textContent = cleanNickname(state.currentUser.nickname);
    dom.profilePhone.textContent = `用户名: ${state.currentUser.username || state.currentUser.phone}`;
    if (state.currentUser.colorTheme) {
      dom.profileAvatar.style.borderColor = state.currentUser.colorTheme.badge;
    }

    // 加载参与的房间列表
    try {
      const res = await Api.getRooms();
      const allRooms = res.rooms || [];
      const activeRooms = allRooms.filter(r => !r.is_archived);
      const archivedRooms = allRooms.filter(r => r.is_archived);

      if (dom.activeRoomsCount) dom.activeRoomsCount.textContent = activeRooms.length;
      if (dom.archivedRoomsCount) dom.archivedRoomsCount.textContent = archivedRooms.length;

      // 依据当前选中的分类过滤展示
      const targetRooms = state.activeRoomFilter === 'archived' ? archivedRooms : activeRooms;

      if (targetRooms.length === 0) {
        dom.myRoomsList.innerHTML = state.activeRoomFilter === 'archived'
          ? '<div class="empty-rooms-hint">暂无已归档活动</div>'
          : '<div class="empty-rooms-hint">暂无进行中活动，可点击右上角新建活动</div>';
        return;
      }

      dom.myRoomsList.innerHTML = targetRooms.map(room => {
        const isCurrent = String(room.id) === String(state.currentRoomId);
        const isArchived = Boolean(room.is_archived);
        const isCreator = state.currentUser && Number(room.creator_id) === Number(state.currentUser.id);

        return `
          <div class="room-list-item ${isCurrent ? 'current' : ''}" data-id="${room.id}">
            <div class="room-item-left">
              <div class="room-item-title-row">
                <span class="room-item-title" title="${escapeHtml(room.title)}">${escapeHtml(room.title)}</span>
                ${isArchived ? '<span class="badge-archived-tag">已归档</span>' : ''}
                ${isCreator ? '<span class="badge-creator-tag">创建者</span>' : ''}
              </div>
              <div class="room-item-code">${isArchived ? '邀请码: <strong>已释放</strong>' : `邀请码: <strong>${room.code}</strong>`} · ${room.member_count}人参与</div>
            </div>
            <div class="room-item-right">
              ${isCreator ? `
                <button class="btn-room-rename" data-id="${room.id}" data-title="${escapeHtml(room.title)}" title="修改活动名称">✏️ 改名</button>
                ${isArchived 
                  ? `<button class="btn-room-unarchive" data-id="${room.id}" title="恢复活动并分配新邀请码">🔄 恢复</button>`
                  : `<button class="btn-room-archive" data-id="${room.id}" title="归档活动并释放邀请码">📦 归档</button>`
                }
              ` : ''}
              ${isCurrent 
                ? '<span style="font-size:12px; font-weight:bold; color:#059669;">当前</span>' 
                : `<span style="font-size:12px; color:#64748B;">${isArchived ? '查看 ➔' : '进入 ➔'}</span>`
              }
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      console.error(e);
    }
  }

  // 全局切换底部 Tab 与对应视图
  function switchTab(targetTab) {
    dom.tabButtons.forEach(b => {
      if (b.getAttribute('data-tab') === targetTab) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    dom.tabViews.forEach(v => {
      if (v.id === targetTab) {
        v.classList.add('active');
      } else {
        v.classList.remove('active');
      }
    });

    if (targetTab === 'viewHome') {
      renderHomeBoard();
    } else if (targetTab === 'viewChecklist') {
      renderChecklist();
    } else if (targetTab === 'viewRecommend') {
      renderTemplates();
    } else if (targetTab === 'viewProfile') {
      renderProfile();
    }
  }

  // 绑定交互事件
  function bindEvents() {
    // 0. 开启横向分类/用户标签栏的鼠标抓取拖拽滑动与滚轮平滑滚动联动
    enableHorizontalDragScroll(dom.recommendCatTabs);
    enableHorizontalDragScroll(dom.checklistUserTabs);
    enableHorizontalDragScroll(dom.othersColumnsScroll);

    // 0.1 页面唤醒、息屏解锁或重新切回网页时立即静默同步并校验推送通道
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (state.currentUser && state.currentRoomId) {
          loadBoardData(true);
          if (!currentEventSource || currentEventSource.readyState === EventSource.CLOSED) {
            connectRoomStream();
          }
        }
      }
    });

    window.addEventListener('focus', () => {
      if (state.currentUser && state.currentRoomId) {
        loadBoardData(true);
      }
    });

    window.addEventListener('pageshow', () => {
      if (state.currentUser && state.currentRoomId) {
        loadBoardData(true);
      }
    });

    // 1. 底部 Tab 切换
    dom.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        switchTab(targetTab);
      });
    });

    // 2. 顶部刷新按钮
    dom.btnRefresh.addEventListener('click', async () => {
      dom.btnRefresh.style.transform = 'rotate(360deg)';
      await loadBoardData();
      showToast('已更新至最新数据');
      setTimeout(() => { dom.btnRefresh.style.transform = 'none'; }, 300);
    });

    // 3. 微信/网页专属邀请卡片与免输码直达分享
    dom.btnOpenShareModal.addEventListener('click', openShareModal);
    dom.btnCloseShareModal.addEventListener('click', () => {
      dom.shareModal.classList.add('hidden');
    });

    dom.btnCopyShareDirectUrl.addEventListener('click', async () => {
      const url = dom.inputShareDirectUrl.value || getDirectInviteUrl(state.currentRoom?.code);
      if (!url) return;

      const ok = await copyTextToClipboard(url);
      if (ok) {
        showToast('🎉 专属免输码直达链接已复制');
        const origText = dom.btnCopyShareDirectUrl.textContent;
        dom.btnCopyShareDirectUrl.textContent = '已复制 ✓';
        dom.btnCopyShareDirectUrl.classList.add('btn-copied-active');
        setTimeout(() => {
          dom.btnCopyShareDirectUrl.textContent = origText;
          dom.btnCopyShareDirectUrl.classList.remove('btn-copied-active');
        }, 1800);
      } else {
        dom.inputShareDirectUrl.focus();
        dom.inputShareDirectUrl.select();
        dom.inputShareDirectUrl.setSelectionRange(0, url.length);
        showToast('已选中直达链接，请长按选择【复制】');
      }
    });

    // 点击直达链接输入框自动全选
    dom.inputShareDirectUrl.addEventListener('click', () => {
      dom.inputShareDirectUrl.focus();
      dom.inputShareDirectUrl.select();
      dom.inputShareDirectUrl.setSelectionRange(0, dom.inputShareDirectUrl.value.length);
    });

    // 点击邀请卡片中的6位邀请码大胶囊快速复制纯数字邀请码
    const posterCodeRow = document.querySelector('.poster-code-row');
    if (posterCodeRow) {
      posterCodeRow.style.cursor = 'pointer';
      posterCodeRow.title = '点击直接复制6位邀请码';
      posterCodeRow.addEventListener('click', async () => {
        const code = state.currentRoom?.code;
        if (!code) return;
        const ok = await copyTextToClipboard(code);
        if (ok) showToast(`🎉 邀请码 ${code} 已复制`);
      });
    }

    dom.btnCopyCompleteInvite.addEventListener('click', handleCopyCompleteInvite);
    dom.btnNativeShare.addEventListener('click', handleNativeShare);

    let pendingSimilarTimer = null;

    // 4. 我的清单快捷添加（支持叠词防手抖、语义相似防误触与二次确认）
    const handleQuickAdd = async () => {
      if (state.boardData?.room?.is_archived) {
        showToast('该活动已归档（只读状态），无法添加物资');
        return;
      }

      const name = dom.inputQuickAdd.value.trim();
      if (!name) {
        showToast('请输入物资名称');
        dom.inputQuickAdd.focus();
        return;
      }

      const myItems = state.boardData?.myItems || [];

      // 1. 完全同名严格查重拦截
      const exactItem = myItems.find(i => i.name.trim().toLowerCase() === name.toLowerCase());
      if (exactItem) {
        showToast(`您的清单中已存在【${name}】，不可重复添加`);
        dom.inputQuickAdd.select();
        locateAndHighlightMyItem(name, 'duplicate');
        return;
      }

      // 2. 纯叠词输入查重拦截（如 可乐 vs 可乐可乐, 纸巾 vs 纸巾纸巾）
      const stutterItem = myItems.find(i => isPureStutter(name, i.name));
      if (stutterItem) {
        showToast(`检测到叠词重复输入，您的清单中已有【${stutterItem.name}】`);
        dom.inputQuickAdd.select();
        locateAndHighlightMyItem(stutterItem.name, 'duplicate');
        return;
      }

      // 3. 模糊语义相似物资检测（如 已有可乐，用户又输入冰镇可乐或百事可乐）
      const similarItem = myItems.find(i => {
        const comp = compareSemantic(name, i.name);
        return comp.isMatch && comp.level === 'SIMILAR';
      });

      if (similarItem) {
        const isConfirming = state.pendingSimilarAdd &&
                             state.pendingSimilarAdd.name.toLowerCase() === name.toLowerCase() &&
                             (Date.now() - state.pendingSimilarAdd.time < 4000);

        if (!isConfirming) {
          // 首次触发：温馨提醒，定位已有项高亮，并给予 4 秒二次确认放行窗口
          state.pendingSimilarAdd = { name: name, time: Date.now() };
          showToast(`💡 清单中已有相似的【${similarItem.name}】(×${similarItem.quantity})，若确需分项添加请再次点击`);
          locateAndHighlightMyItem(similarItem.name, 'similar');

          if (pendingSimilarTimer) clearTimeout(pendingSimilarTimer);
          pendingSimilarTimer = setTimeout(() => {
            state.pendingSimilarAdd = null;
          }, 4000);
          return;
        }
      }

      // 用户二次点击确认，或无冲突，正常添加
      if (pendingSimilarTimer) {
        clearTimeout(pendingSimilarTimer);
        pendingSimilarTimer = null;
      }
      state.pendingSimilarAdd = null;

      // 检查是否有队友准备了同类物资，给出温馨提示
      let teammateTip = '';
      for (const col of (state.boardData?.othersItems || [])) {
        for (const it of col.items) {
          const comp = compareSemantic(name, it.name);
          if (comp.isMatch) {
            teammateTip = ` (提示：${cleanNickname(col.user.nickname)} 也准备了【${it.name}】，已为您智能汇总)`;
            break;
          }
        }
        if (teammateTip) break;
      }

      try {
        await Api.addItem(state.currentRoomId, name, 1);
        dom.inputQuickAdd.value = '';
        showToast(`已添加「${name}」${teammateTip}`);
        await loadBoardData();
      } catch (err) {
        showToast(err.message || '添加失败');
        if (err.message && (err.message.includes('已存在') || err.message.includes('叠词'))) {
          locateAndHighlightMyItem(name, 'duplicate');
        }
      }
    };

    dom.btnAddQuickItem.addEventListener('click', handleQuickAdd);
    dom.inputQuickAdd.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleQuickAdd();
    });

    // 5. 点击“我的物资”卡片 -> 弹出人性化修改/删除 Action Sheet
    dom.myItemsList.addEventListener('click', (e) => {
      const card = e.target.closest('.my-item-card');
      if (!card) return;

      if (state.boardData?.room?.is_archived) {
        showToast('该活动已归档（只读状态），无法修改或删除物资');
        return;
      }

      const itemId = parseInt(card.getAttribute('data-id'), 10);
      const name = card.getAttribute('data-name');
      const quantity = parseInt(card.getAttribute('data-quantity'), 10) || 1;

      state.editingItem = { id: itemId, name, quantity };
      dom.modalEditName.value = name;
      dom.modalEditQuantity.value = quantity;
      dom.itemActionModal.classList.remove('hidden');
    });

    // 编辑弹窗内部步进器与保存/删除
    dom.modalBtnMinus.addEventListener('click', () => {
      let q = parseInt(dom.modalEditQuantity.value, 10) || 1;
      if (q > 1) dom.modalEditQuantity.value = q - 1;
    });

    dom.modalBtnPlus.addEventListener('click', () => {
      let q = parseInt(dom.modalEditQuantity.value, 10) || 1;
      if (q < 99) dom.modalEditQuantity.value = q + 1;
    });

    dom.modalBtnSave.addEventListener('click', async () => {
      if (!state.editingItem) return;
      const newName = dom.modalEditName.value.trim();
      const newQty = parseInt(dom.modalEditQuantity.value, 10) || 1;
      if (!newName) {
        showToast('物资名称不能为空');
        return;
      }

      // 个人清单查重：不能修改为个人清单中已有的其他物资名称或叠词
      const myItems = state.boardData?.myItems || [];
      const otherMyItems = myItems.filter(i => i.id !== state.editingItem.id);

      // 完全同名
      if (otherMyItems.some(i => i.name.trim().toLowerCase() === newName.toLowerCase())) {
        showToast(`您的清单中已存在同名物资【${newName}】，不可重复命名`);
        dom.modalEditName.select();
        locateAndHighlightMyItem(newName, 'duplicate');
        return;
      }

      // 叠词重复
      const stutterItem = otherMyItems.find(i => isPureStutter(newName, i.name));
      if (stutterItem) {
        showToast(`修改名称与已有物资【${stutterItem.name}】构成叠词重复`);
        dom.modalEditName.select();
        locateAndHighlightMyItem(stutterItem.name, 'duplicate');
        return;
      }

      try {
        await Api.updateItem(state.editingItem.id, newName, newQty);
        dom.itemActionModal.classList.add('hidden');
        showToast('已保存修改');
        await loadBoardData();
      } catch (err) {
        showToast(err.message || '修改失败');
      }
    });

    dom.modalBtnDelete.addEventListener('click', async () => {
      if (!state.editingItem) return;
      if (confirm(`确定删除物资「${state.editingItem.name}」吗？`)) {
        try {
          await Api.deleteItem(state.editingItem.id);
          dom.itemActionModal.classList.add('hidden');
          showToast('已删除物资');
          await loadBoardData();
        } catch (err) {
          showToast(err.message || '删除失败');
        }
      }
    });

    dom.modalBtnCancel.addEventListener('click', () => {
      dom.itemActionModal.classList.add('hidden');
    });

    // 6. 点击最终汇总清单卡片 -> 弹出贡献者详情查看抽屉
    dom.summaryItemsGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.summary-card');
      if (!card || !state.boardData) return;
      const index = parseInt(card.getAttribute('data-index'), 10);
      const entry = state.boardData.summaryList[index];
      if (!entry) return;

      dom.summaryDetailName.textContent = entry.name;
      if (entry.isDuplicate) {
        dom.summaryDetailTag.textContent = `⚠️ 重复准备 (共 ${entry.duplicateCount} 人重复)`;
        dom.summaryDetailTag.classList.remove('hidden');
      } else {
        dom.summaryDetailTag.textContent = `✨ 正常 (1人准备)`;
        dom.summaryDetailTag.classList.remove('hidden');
      }

      // 变体说明横幅提示
      if (dom.summaryDetailVariantsBanner) {
        if (entry.hasVariants && Array.isArray(entry.variants) && entry.variants.length > 1) {
          dom.summaryDetailVariantsBanner.innerHTML = `<span>💡</span><span>已智能聚类 <strong>${entry.variants.length}</strong> 种同类物资叫法：${escapeHtml(entry.variants.join('、'))}</span>`;
          dom.summaryDetailVariantsBanner.classList.remove('hidden');
        } else {
          dom.summaryDetailVariantsBanner.classList.add('hidden');
        }
      }

      dom.summaryContributorsList.innerHTML = entry.contributors.map(c => `
        <div class="contributor-item" style="background:${c.colorTheme.bg}; border: 1px solid ${c.colorTheme.border};">
          <div class="c-user-info">
            <span class="user-avatar-dot" style="background:${c.colorTheme.badge};"></span>
            <span style="color:${c.colorTheme.text}; font-weight:700;">${escapeHtml(cleanNickname(c.nickname))}</span>
          </div>
          <div class="c-item-specific">
            <span class="c-variant-name" style="color:${c.colorTheme.text}; background:${c.colorTheme.cardBg}; border:1px solid ${c.colorTheme.border};">
              带了【${escapeHtml(c.namesText || entry.name)}】
            </span>
            <span class="c-qty" style="color:${c.colorTheme.badge}; font-weight:800; font-size:13px;">×${c.quantity}</span>
          </div>
        </div>
      `).join('');

      dom.summaryDetailModal.classList.remove('hidden');
    });

    dom.modalBtnCloseDetail.addEventListener('click', () => {
      dom.summaryDetailModal.classList.add('hidden');
    });

    // 7. 推荐库分类切换与添加
    dom.recommendCatTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.cat-tab-btn');
      if (!btn) return;
      state.activeRecCategory = btn.getAttribute('data-category');
      renderTemplates();
    });

    // 推荐库单项添加与复选框切换
    dom.recommendList.addEventListener('click', async (e) => {
      if (state.boardData?.room?.is_archived) {
        showToast('该活动已归档（只读状态），无法添加物资');
        return;
      }

      // 1. 单个添加按钮点击
      const addBtn = e.target.closest('.btn-add-rec');
      if (addBtn) {
        const name = addBtn.getAttribute('data-name');
        if (addBtn.disabled || addBtn.classList.contains('added')) {
          showToast(`「${name}」已在您的清单中，无需重复添加`);
          locateAndHighlightMyItem(name, 'duplicate');
          return;
        }

        const myItems = state.boardData?.myItems || [];

        // 完全同名
        if (myItems.some(i => i.name.trim().toLowerCase() === name.trim().toLowerCase())) {
          showToast(`「${name}」已在您的清单中，不可重复添加`);
          locateAndHighlightMyItem(name, 'duplicate');
          renderTemplates();
          return;
        }

        // 纯叠词输入
        const stutterItem = myItems.find(i => isPureStutter(name, i.name));
        if (stutterItem) {
          showToast(`检测到叠词重复，您的清单中已有【${stutterItem.name}】`);
          locateAndHighlightMyItem(stutterItem.name, 'duplicate');
          renderTemplates();
          return;
        }

        // 模糊语义相似物资检查
        const similarItem = myItems.find(i => {
          const comp = compareSemantic(name, i.name);
          return comp.isMatch && comp.level === 'SIMILAR';
        });

        if (similarItem) {
          const isConfirming = state.pendingSimilarAdd &&
                               state.pendingSimilarAdd.name.toLowerCase() === name.toLowerCase() &&
                               (Date.now() - state.pendingSimilarAdd.time < 4000);
          if (!isConfirming) {
            state.pendingSimilarAdd = { name: name, time: Date.now() };
            showToast(`💡 清单中已有相似物资【${similarItem.name}】，若确需添加请再次点击`);
            locateAndHighlightMyItem(similarItem.name, 'similar');
            return;
          }
        }

        state.pendingSimilarAdd = null;
        const tplId = parseInt(addBtn.getAttribute('data-id'), 10);
        try {
          await Api.addItem(state.currentRoomId, name, 1);
          state.selectedRecItems.delete(tplId);
          showToast(`已将「${name}」加入我的清单`);
          await loadBoardData();
          renderTemplates();
        } catch (err) {
          showToast(err.message || '添加失败');
        }
        return;
      }

      // 2. 如果点击已添加的行（卡片或复选框），彻底阻止二次选中
      const card = e.target.closest('.rec-item-card');
      if (card && card.classList.contains('is-added')) {
        const cb = card.querySelector('.rec-checkbox');
        if (cb) cb.checked = false;
        const itemName = card.getAttribute('data-name');
        showToast(`「${itemName}」已在您的清单中，不可二次勾选`);
        return;
      }

      // 3. 复选框多选或点击左侧区域切换勾选
      const checkbox = e.target.closest('.rec-checkbox');
      const itemLeft = e.target.closest('.rec-item-left');
      if (checkbox || itemLeft) {
        const targetCb = checkbox || itemLeft.querySelector('.rec-checkbox');
        if (!targetCb || targetCb.disabled) return;

        // 如果点击的是左侧文本区域而非 checkbox 本身，切换勾选状态
        if (!checkbox) {
          targetCb.checked = !targetCb.checked;
        }

        const tplId = parseInt(targetCb.getAttribute('data-id'), 10);
        if (targetCb.checked) {
          state.selectedRecItems.add(tplId);
        } else {
          state.selectedRecItems.delete(tplId);
        }
        updateBatchBar();
      }
    });

    // 推荐库批量导入
    dom.btnBatchImport.addEventListener('click', async () => {
      if (state.boardData?.room?.is_archived) {
        showToast('该活动已归档（只读状态），无法添加物资');
        return;
      }

      if (state.selectedRecItems.size === 0) return;
      const itemsToImport = [];
      state.templatesData.categories.forEach(cat => {
        cat.items.forEach(it => {
          if (state.selectedRecItems.has(it.id)) {
            itemsToImport.push({ name: it.name, quantity: 1 });
          }
        });
      });

      // 过滤掉当前用户清单中已有的物资，防止重名
      const myItems = state.boardData?.myItems || [];
      const myNames = new Set(myItems.map(i => i.name.trim().toLowerCase()));
      const filtered = itemsToImport.filter(it => !myNames.has(it.name.trim().toLowerCase()));

      if (filtered.length === 0) {
        showToast('所选物资已全部存在于您的个人清单中，不可重复添加');
        return;
      }

      try {
        await Api.batchAddItems(state.currentRoomId, filtered);
        state.selectedRecItems.clear();
        showToast(`成功将 ${filtered.length} 项物资批量加入我的清单！`);
        await loadBoardData();
        renderTemplates();
      } catch (err) {
        showToast(err.message || '批量添加失败');
      }
    });

    // 8. 清单核对 Checklist 点击打钩切换（仅本人可勾选）
    dom.checklistItemsContainer.addEventListener('click', async (e) => {
      const row = e.target.closest('.check-item-row');
      if (!row) return;

      if (state.boardData?.room?.is_archived) {
        showToast('该活动已归档（只读状态），无法修改装车状态');
        return;
      }

      const isMine = row.getAttribute('data-mine') === 'true';
      const ownerName = row.getAttribute('data-owner') || '其他成员';

      if (!isMine) {
        showToast(`这是【${ownerName}】准备的物资，仅本人可勾选确认`);
        return;
      }

      const itemId = parseInt(row.getAttribute('data-id'), 10);
      const isCurrentlyChecked = row.getAttribute('data-checked') === '1';

      try {
        await Api.toggleCheckItem(itemId, !isCurrentlyChecked);
        await loadBoardData();
      } catch (err) {
        showToast(err.message || '更新状态失败');
      }
    });

    // 8.1 清单核对：点击用户分类标签切换过滤
    if (dom.checklistUserTabs) {
      dom.checklistUserTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.check-user-tab-btn');
        if (!btn) return;
        const uid = btn.getAttribute('data-uid');
        state.selectedChecklistUserId = uid === 'all' ? 'all' : parseInt(uid, 10);
        renderChecklist();
      });
    }

    // 活动分类切换：进行中 vs 已归档
    if (dom.roomFilterTabs) {
      dom.roomFilterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const filter = tab.getAttribute('data-filter');
          if (state.activeRoomFilter === filter) return;
          state.activeRoomFilter = filter;
          dom.roomFilterTabs.forEach(t => t.classList.toggle('active', t === tab));
          renderProfile();
        });
      });
    }

    // 修改用户昵称弹窗交互
    if (dom.btnEditNickname) {
      dom.btnEditNickname.addEventListener('click', () => {
        if (!state.currentUser) return;
        dom.inputEditNickname.value = cleanNickname(state.currentUser.nickname);
        dom.editNicknameError.classList.add('hidden');
        dom.editNicknameError.textContent = '';
        dom.editNicknameModal.classList.remove('hidden');
        dom.inputEditNickname.focus();
      });

      dom.inputEditNickname.addEventListener('input', () => {
        dom.editNicknameError.classList.add('hidden');
        dom.editNicknameError.textContent = '';
      });
    }

    if (dom.btnCloseEditNicknameModal) {
      dom.btnCloseEditNicknameModal.addEventListener('click', () => {
        dom.editNicknameModal.classList.add('hidden');
      });
    }

    if (dom.btnCancelEditNickname) {
      dom.btnCancelEditNickname.addEventListener('click', () => {
        dom.editNicknameModal.classList.add('hidden');
      });
    }

    if (dom.editNicknameForm) {
      dom.editNicknameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newNick = dom.inputEditNickname.value.trim();
        if (!newNick) {
          dom.editNicknameError.textContent = '请输入用户昵称';
          dom.editNicknameError.classList.remove('hidden');
          return;
        }
        if (newNick.length > 8) {
          dom.editNicknameError.textContent = '昵称长度不能超过8个字';
          dom.editNicknameError.classList.remove('hidden');
          return;
        }

        try {
          const res = await Api.updateProfile(newNick);
          state.currentUser = res.user;
          dom.editNicknameModal.classList.add('hidden');
          showToast(`全局昵称已成功修改为「${cleanNickname(newNick)}」`);
          await loadBoardData(true);
          renderProfile();
        } catch (err) {
          dom.editNicknameError.textContent = err.message || '修改昵称失败';
          dom.editNicknameError.classList.remove('hidden');
        }
      });
    }

    // 修改活动专属昵称弹窗交互 (首页左上栏 ✏️ 按钮或标题点击触发)
    const openRoomNicknameModal = () => {
      if (!state.currentUser) return;
      const currentMember = state.boardData?.currentUser;
      const currentRoomNick = currentMember?.room_nickname || '';
      dom.inputEditRoomNickname.value = currentRoomNick;
      dom.editRoomNicknameError.classList.add('hidden');
      dom.editRoomNicknameError.textContent = '';
      dom.editRoomNicknameModal.classList.remove('hidden');
      dom.inputEditRoomNickname.focus();
    };

    if (dom.btnEditRoomNickname) {
      dom.btnEditRoomNickname.addEventListener('click', openRoomNicknameModal);
    }
    if (dom.myColTitle) {
      dom.myColTitle.addEventListener('click', openRoomNicknameModal);
    }

    if (dom.inputEditRoomNickname) {
      dom.inputEditRoomNickname.addEventListener('input', () => {
        dom.editRoomNicknameError.classList.add('hidden');
        dom.editRoomNicknameError.textContent = '';
      });
    }

    if (dom.btnCancelEditRoomNickname) {
      dom.btnCancelEditRoomNickname.addEventListener('click', () => {
        dom.editRoomNicknameModal.classList.add('hidden');
      });
    }

    if (dom.editRoomNicknameForm) {
      dom.editRoomNicknameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newNick = dom.inputEditRoomNickname.value.trim();
        if (newNick.length > 8) {
          dom.editRoomNicknameError.textContent = '活动昵称长度不能超过8个字';
          dom.editRoomNicknameError.classList.remove('hidden');
          return;
        }

        try {
          const res = await Api.updateRoomNickname(state.currentRoomId, newNick);
          dom.editRoomNicknameModal.classList.add('hidden');
          showToast(newNick ? `本活动专属昵称已设为「${newNick}」` : `已恢复使用全局默认昵称「${cleanNickname(state.currentUser.nickname)}」`);
          await loadBoardData(true);
        } catch (err) {
          dom.editRoomNicknameError.textContent = err.message || '修改活动昵称失败';
          dom.editRoomNicknameError.classList.remove('hidden');
        }
      });
    }

    // 修改活动名称弹窗交互 (仅活动创建者)
    let editingRoomTitleId = null;
    function openEditRoomTitleModal(roomId, currentTitle) {
      editingRoomTitleId = roomId;
      dom.inputEditRoomTitle.value = currentTitle;
      dom.editRoomTitleError.classList.add('hidden');
      dom.editRoomTitleError.textContent = '';
      dom.editRoomTitleModal.classList.remove('hidden');
      dom.inputEditRoomTitle.focus();
    }

    if (dom.inputEditRoomTitle) {
      dom.inputEditRoomTitle.addEventListener('input', () => {
        dom.editRoomTitleError.classList.add('hidden');
        dom.editRoomTitleError.textContent = '';
      });
    }

    if (dom.btnCancelEditRoomTitle) {
      dom.btnCancelEditRoomTitle.addEventListener('click', () => {
        dom.editRoomTitleModal.classList.add('hidden');
      });
    }

    if (dom.editRoomTitleForm) {
      dom.editRoomTitleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newTitle = dom.inputEditRoomTitle.value.trim();
        if (!newTitle) {
          dom.editRoomTitleError.textContent = '活动名称不能为空';
          dom.editRoomTitleError.classList.remove('hidden');
          return;
        }
        if (newTitle.length > 25) {
          dom.editRoomTitleError.textContent = '活动名称不能超过25个字';
          dom.editRoomTitleError.classList.remove('hidden');
          return;
        }

        try {
          await Api.updateRoomTitle(editingRoomTitleId, newTitle);
          dom.editRoomTitleModal.classList.add('hidden');
          showToast(`活动名称已更新为「${newTitle}」`);
          if (String(editingRoomTitleId) === String(state.currentRoomId)) {
            await loadBoardData(true);
          }
          await renderProfile();
        } catch (err) {
          dom.editRoomTitleError.textContent = err.message || '修改活动名称失败';
          dom.editRoomTitleError.classList.remove('hidden');
        }
      });
    }

    // 首页其他人清单列：活动创建者清除成员及其物资清单
    dom.othersColumnsScroll.addEventListener('click', async (e) => {
      const btnPurge = e.target.closest('.btn-purge-user-list');
      if (!btnPurge) return;
      e.stopPropagation();
      const targetUserId = parseInt(btnPurge.getAttribute('data-user-id'), 10);
      const targetUserName = btnPurge.getAttribute('data-user-name') || '该成员';
      if (!confirm(`确定要清除【${targetUserName}】的物资清单并将其移出本活动吗？\n（此操作可用于活动二次复用时清理未参与人员）`)) {
        return;
      }
      try {
        await Api.removeMember(state.currentRoomId, targetUserId);
        showToast(`已清除【${targetUserName}】及其物资清单`);
        await loadBoardData(true);
      } catch (err) {
        showToast(err.message || '清除失败');
      }
    });

    // 我的页面：点击我参与的活动（支持归档、恢复、改名与点击直达活动首页）
    dom.myRoomsList.addEventListener('click', async (e) => {
      // 0. 修改活动名称按钮 (创建者专属)
      const btnRename = e.target.closest('.btn-room-rename');
      if (btnRename) {
        e.stopPropagation();
        const roomId = btnRename.getAttribute('data-id');
        const title = btnRename.getAttribute('data-title') || '';
        openEditRoomTitleModal(roomId, title);
        return;
      }

      // 1. 归档活动按钮 (释放房间邀请码，只读锁定)
      const btnArchive = e.target.closest('.btn-room-archive');
      if (btnArchive) {
        e.stopPropagation();
        const roomId = btnArchive.getAttribute('data-id');
        if (!confirm('确定要归档此活动吗？\n归档后活动将转为只读浏览模式（所有人禁止添加、修改或删除物资），并释放6位数字邀请码。')) {
          return;
        }
        try {
          const res = await Api.archiveRoom(roomId);
          showToast(res.message || '活动已归档并释放房间号');
          if (String(roomId) === String(state.currentRoomId)) {
            await loadBoardData(true);
          }
          await renderProfile();
        } catch (err) {
          showToast(err.message || '归档活动失败');
        }
        return;
      }

      // 2. 恢复已归档活动按钮 (重新生成新邀请码)
      const btnUnarchive = e.target.closest('.btn-room-unarchive');
      if (btnUnarchive) {
        e.stopPropagation();
        const roomId = btnUnarchive.getAttribute('data-id');
        try {
          const res = await Api.unarchiveRoom(roomId);
          showToast(`活动已恢复进行中，新邀请码：${res.code}`);
          if (String(roomId) === String(state.currentRoomId)) {
            await loadBoardData(true);
          }
          await renderProfile();
        } catch (err) {
          showToast(err.message || '恢复活动失败');
        }
        return;
      }

      // 3. 点击活动卡片本身，直接跳转到该活动首页
      const item = e.target.closest('.room-list-item');
      if (!item) return;
      const roomId = item.getAttribute('data-id');
      state.currentRoomId = roomId;
      Api.setCurrentRoomId(roomId);
      await loadBoardData();
      connectRoomStream();
      switchTab('viewHome');
      showToast(`已进入「${state.currentRoom?.title || '活动'}」首页`);
    });

    // 顶部活动码按钮打开切换
    dom.btnSwitchRoom.addEventListener('click', () => {
      switchTab('viewProfile');
    });

    // 创建活动弹窗 (美化统一UI)
    dom.btnOpenCreateRoomModal.addEventListener('click', () => {
      if (dom.roomModalLogo) dom.roomModalLogo.textContent = '🏕️';
      dom.roomModalTitle.textContent = '新建露营活动';
      if (dom.roomModalSub) dom.roomModalSub.textContent = '发起新的聚会活动，邀请朋友一起挑选和准备物资';
      dom.createRoomSection.classList.remove('hidden');
      dom.joinRoomSection.classList.add('hidden');
      dom.inputNewRoomTitle.value = '';
      if (dom.createRoomError) dom.createRoomError.classList.add('hidden');
      dom.roomModal.classList.remove('hidden');
      setTimeout(() => dom.inputNewRoomTitle.focus(), 50);
    });

    const handleCreateRoomSubmit = async () => {
      const title = dom.inputNewRoomTitle.value.trim();
      if (!title) {
        if (dom.createRoomError) {
          dom.createRoomError.textContent = '请输入活动名称';
          dom.createRoomError.classList.remove('hidden');
        }
        showToast('请输入活动名称');
        dom.inputNewRoomTitle.focus();
        return;
      }
      if (title.length > 25) {
        if (dom.createRoomError) {
          dom.createRoomError.textContent = '活动名称不能超过25个字';
          dom.createRoomError.classList.remove('hidden');
        }
        return;
      }
      try {
        const res = await Api.createRoom(title);
        state.currentRoomId = res.room.id;
        Api.setCurrentRoomId(res.room.id);
        dom.roomModal.classList.add('hidden');
        showToast(`活动创建成功！邀请码：${res.room.code}`);
        await loadBoardData();
        connectRoomStream();
        switchTab('viewHome');
      } catch (err) {
        if (dom.createRoomError) {
          dom.createRoomError.textContent = err.message || '创建失败';
          dom.createRoomError.classList.remove('hidden');
        }
        showToast(err.message || '创建失败');
      }
    };

    dom.btnSubmitCreateRoom.addEventListener('click', handleCreateRoomSubmit);
    if (dom.formCreateRoom) dom.formCreateRoom.addEventListener('submit', (e) => { e.preventDefault(); handleCreateRoomSubmit(); });
    if (dom.btnCancelCreateRoom) dom.btnCancelCreateRoom.addEventListener('click', () => dom.roomModal.classList.add('hidden'));

    if (dom.inputNewRoomTitle) {
      dom.inputNewRoomTitle.addEventListener('input', () => {
        if (dom.createRoomError) dom.createRoomError.classList.add('hidden');
      });
    }

    // 输入码加入活动 (美化统一UI)
    dom.btnOpenJoinRoomModal.addEventListener('click', () => {
      if (dom.roomModalLogo) dom.roomModalLogo.textContent = '🔑';
      dom.roomModalTitle.textContent = '加入已有活动';
      if (dom.roomModalSub) dom.roomModalSub.textContent = '输入好友分享的6位邀请码，立即进入活动协同';
      dom.createRoomSection.classList.add('hidden');
      dom.joinRoomSection.classList.remove('hidden');
      dom.inputJoinRoomCode.value = '';
      if (dom.joinRoomError) dom.joinRoomError.classList.add('hidden');
      dom.roomModal.classList.remove('hidden');
      setTimeout(() => dom.inputJoinRoomCode.focus(), 50);
    });

    const handleJoinRoomSubmit = async () => {
      const code = dom.inputJoinRoomCode.value.trim();
      if (!code || !/^\d{6}$/.test(code)) {
        if (dom.joinRoomError) {
          dom.joinRoomError.textContent = '请输入6位纯数字邀请码';
          dom.joinRoomError.classList.remove('hidden');
        }
        showToast('请输入6位纯数字邀请码');
        dom.inputJoinRoomCode.focus();
        return;
      }
      try {
        const res = await Api.joinRoom(code);
        state.currentRoomId = res.room.id;
        Api.setCurrentRoomId(res.room.id);
        dom.roomModal.classList.add('hidden');
        showToast(`已成功加入「${res.room.title}」！`);
        await loadBoardData();
        connectRoomStream();
        switchTab('viewHome');
      } catch (err) {
        if (dom.joinRoomError) {
          dom.joinRoomError.textContent = err.message || '加入失败';
          dom.joinRoomError.classList.remove('hidden');
        }
        showToast(err.message || '加入失败');
      }
    };

    dom.btnSubmitJoinRoom.addEventListener('click', handleJoinRoomSubmit);
    if (dom.formJoinRoom) dom.formJoinRoom.addEventListener('submit', (e) => { e.preventDefault(); handleJoinRoomSubmit(); });
    if (dom.btnCancelJoinRoom) dom.btnCancelJoinRoom.addEventListener('click', () => dom.roomModal.classList.add('hidden'));

    if (dom.inputJoinRoomCode) {
      dom.inputJoinRoomCode.addEventListener('input', () => {
        if (dom.joinRoomError) dom.joinRoomError.classList.add('hidden');
      });
    }

    if (dom.btnCloseRoomModal) {
      dom.btnCloseRoomModal.forEach(btn => btn.addEventListener('click', () => dom.roomModal.classList.add('hidden')));
    }

    // 10. 登录/注册表单
    dom.btnLogout.addEventListener('click', () => {
      if (currentEventSource) {
        currentEventSource.close();
        currentEventSource = null;
      }
      updateSyncStatus('disconnected');
      Api.setToken(null);
      state.currentUser = null;
      openAuthModal('login');
    });

    dom.btnToggleAuthMode.addEventListener('click', () => {
      openAuthModal(state.authMode === 'login' ? 'register' : 'login');
    });

    dom.authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = (dom.authPhone.value || '').trim();
      const pwd = dom.authPassword.value.trim();
      const nickname = dom.authNickname.value.trim();
      dom.authErrorMsg.classList.add('hidden');

      if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]{6,12}$/.test(username)) {
        showAuthError('用户名必须为6~12位字符（支持字母、数字、下划线及中文）');
        return;
      }
      if (!/^\d{6,8}$/.test(pwd)) {
        showAuthError('密码必须为6~8位纯数字');
        return;
      }

      if (state.authMode === 'register') {
        if (!nickname) {
          showAuthError('请填写用户昵称（必填，将作为用户名在列表中显示）');
          dom.authNickname.focus();
          return;
        }
        if (nickname.length > 8) {
          showAuthError('用户昵称长度不能超过8个字');
          dom.authNickname.focus();
          return;
        }
      }

      try {
        let res;
        if (state.authMode === 'login') {
          res = await Api.login(username, pwd);
        } else {
          res = await Api.register(username, pwd, nickname);
        }

        Api.setToken(res.token);
        state.currentUser = res.user;
        state.selectedChecklistUserId = res.user.id;
        dom.authModal.classList.add('hidden');
        showToast(state.authMode === 'login' ? '🎉 登录成功！' : '🎉 注册成功，已直接登录！');

        // 检查是否有受邀待进活动，免输码直接进房
        const pendingCode = sessionStorage.getItem('pending_invite_code');
        if (pendingCode) {
          await handleAutoJoinPendingRoom(pendingCode);
        } else {
          await loadBoardData();
        }
        connectRoomStream();
        await loadTemplates();
        switchTab('viewHome');
      } catch (err) {
        showAuthError(err.message || '请求失败');
      }
    });

    // 点击弹窗背景关闭
    [dom.itemActionModal, dom.summaryDetailModal, dom.roomModal, dom.shareModal, dom.editNicknameModal, dom.editRoomNicknameModal, dom.editRoomTitleModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.add('hidden');
          }
        });
      }
    });
  }

  function openAuthModal(mode) {
    state.authMode = mode;
    dom.authErrorMsg.classList.add('hidden');

    // 如果存在受邀待加入活动，展示受邀专属横幅
    const pendingCode = sessionStorage.getItem('pending_invite_code');
    if (pendingCode) {
      Api.previewRoom(pendingCode).then(res => {
        if (res.room && dom.authInviteHint) {
          dom.authInviteHint.innerHTML = `🏕️ <strong>受邀加入活动：</strong>【${escapeHtml(res.room.title)}】<br><span style="font-size:10px; opacity:0.85;">完成${mode === 'login' ? '登录' : '注册'}后将免输邀请码自动进房</span>`;
          dom.authInviteHint.classList.remove('hidden');
        }
      }).catch(() => {
        if (dom.authInviteHint) dom.authInviteHint.classList.add('hidden');
      });
    } else {
      if (dom.authInviteHint) dom.authInviteHint.classList.add('hidden');
    }
    if (mode === 'login') {
      dom.authTitle.textContent = '用户名登录';
      dom.btnAuthSubmit.textContent = '立即登录';
      dom.groupNickname.classList.add('hidden');
      dom.authToggleHint.textContent = '还没有账号？';
      dom.btnToggleAuthMode.textContent = '切换为注册';
    } else {
      dom.authTitle.textContent = '快速注册账号';
      dom.btnAuthSubmit.textContent = '立即注册并进入';
      dom.groupNickname.classList.remove('hidden');
      dom.authNickname.value = '';
      dom.authToggleHint.textContent = '已有账号？';
      dom.btnToggleAuthMode.textContent = '切换为登录';
    }
    dom.authModal.classList.remove('hidden');
  }

  function showAuthError(msg) {
    dom.authErrorMsg.textContent = msg;
    dom.authErrorMsg.classList.remove('hidden');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 规范化昵称，去除多余重复的 (我) 或 （我） 后缀
  function cleanNickname(name) {
    if (!name) return '';
    return String(name).replace(/\s*[\(（]我[\)）]+/g, '').trim();
  }

  // 渲染美观精致的胶囊进度徽章（去括号，纯净数字比例）
  function renderRatioBadge(checked, total) {
    const isDone = total > 0 && checked === total;
    const isPartial = checked > 0 && !isDone;
    let badgeClass = 'ratio-zero';
    if (isDone) badgeClass = 'ratio-done';
    else if (isPartial) badgeClass = 'ratio-partial';

    if (isDone) {
      return `
        <span class="tab-ratio-pill ${badgeClass}">
          <span class="ratio-icon">✓</span>
          <span class="ratio-text">${checked}/${total}</span>
        </span>
      `;
    }

    return `
      <span class="tab-ratio-pill ${badgeClass}">
        <span class="ratio-cur">${checked}</span><span class="ratio-slash">/</span><span class="ratio-total">${total}</span>
      </span>
    `;
  }

  // 启动应用
  init();
})();
