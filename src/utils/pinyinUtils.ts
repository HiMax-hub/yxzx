// Utility for Chinese Pinyin Initial Extraction and Multi-dimensional Fuzzy Search

// Common Chinese character to Pinyin initials mapping groups
const PINYIN_GROUPS: Record<string, string> = {
  a: '安奥艾阿',
  b: '白包毕卜鲍柏薄卞贝边斌博波冰保彪彬',
  c: '陈程曹蔡崔常丛成查初车岑储迟池操超晨辰春财昌',
  d: '董邓丁戴杜段狄刁党段杜达德定东',
  e: '娥恩',
  f: '冯傅范方程樊费付房丰福发凤芳菲峰飞',
  g: '郭顾龚葛管谷耿关甘桂高葛古耿刚广国光贵',
  h: '黄韩何郝侯贺洪霍胡花华黄浩宏辉海航慧',
  j: '蒋贾姜金江季焦纪靳景简吉晋建军杰佳洁娟娟',
  k: '孔康柯匡寇开凯宽',
  l: '李刘林罗梁吕卢陆廖龙黎赖兰鲁柳路凌雷乐丽玲莉莲亮磊琳',
  m: '马毛孟莫梅牟苗闵满穆马明敏美茂',
  n: '倪牛聂宁年农那娜男南',
  o: '欧',
  p: '彭潘庞裴平朴蒲鹏萍培品',
  q: '钱邱秦乔齐祁曲屈全强巧琪琴青泉清',
  r: '任荣阮芮饶冉仁瑞若然',
  s: '孙宋沈苏史邵施申时舒盛席司隋水石盛树山森生松松双胜',
  t: '唐谭汤陶田童涂覃滕佟陶涛婷天铁通',
  w: '王吴魏汪万武文温伍韦位翁危卫伟旺万威望',
  x: '徐谢薛许夏熊向刑辛项席宣肖夏新祥秀雪萱鑫欣香霞轩',
  y: '杨于袁叶阎余姚尹易殷颜严俞尤岳沿游阳郁元怡语英玉媛银义宇洋',
  z: '张赵周朱郑曾钟邹翟章祝左詹甄植臧曾宗志超政真智珍芝中忠兆',
};

const PINYIN_MAP: Record<string, string> = {};
Object.entries(PINYIN_GROUPS).forEach(([initial, chars]) => {
  for (const char of chars) {
    PINYIN_MAP[char] = initial;
  }
});

// Fallback Unicode range heuristic for Chinese character first letter
function getPinyinInitialFromChar(char: string): string {
  if (!char) return '';
  if (/[a-zA-Z0-9]/.test(char)) return char.toLowerCase();
  
  if (PINYIN_MAP[char]) {
    return PINYIN_MAP[char];
  }

  // Unicode bounds approximate phonetic ranges for common Simplified Chinese
  const code = char.charCodeAt(0);
  if (code >= 0x4e00 && code <= 0x9fa5) {
    if (code >= 0xb0a1 && code <= 0xb0c4) return 'a';
    if (code >= 0xb0c5 && code <= 0xb2c0) return 'b';
    if (code >= 0xb2c1 && code <= 0xb4ed) return 'c';
    if (code >= 0xb4ee && code <= 0xb6e9) return 'd';
    if (code >= 0xb6ea && code <= 0xb7a1) return 'e';
    if (code >= 0xb7a2 && code <= 0xb8c0) return 'f';
    if (code >= 0xb8c1 && code <= 0xb9fd) return 'g';
    if (code >= 0xb9fe && code <= 0xbbf6) return 'h';
    if (code >= 0xbbf7 && code <= 0xbfa5) return 'j';
    if (code >= 0xbfa6 && code <= 0xc0ab) return 'k';
    if (code >= 0xc0ac && code <= 0xc2e7) return 'l';
    if (code >= 0xc2e8 && code <= 0xc4c2) return 'm';
    if (code >= 0xc4c3 && code <= 0xc5b5) return 'n';
    if (code >= 0xc5b6 && code <= 0xc5bd) return 'o';
    if (code >= 0xc5be && code <= 0xc6d9) return 'p';
    if (code >= 0xc6da && code <= 0xc8ba) return 'q';
    if (code >= 0xc8bb && code <= 0xc8f5) return 'r';
    if (code >= 0xc8f6 && code <= 0xcbfa) return 's';
    if (code >= 0xcbfb && code <= 0xcdd9) return 't';
    if (code >= 0xcdda && code <= 0xcef3) return 'w';
    if (code >= 0xcef4 && code <= 0xd188) return 'x';
    if (code >= 0xd189 && code <= 0xd4d0) return 'y';
    if (code >= 0xd4d1 && code <= 0xd7f9) return 'z';
  }

  return char.toLowerCase();
}

/**
 * Extracts Pinyin initials for a given Chinese string
 * e.g., "张锦祥" -> "zjx", "李晓明" -> "lxm", "郭晓敏" -> "gxm"
 */
export function getPinyinInitials(text: string): string {
  if (!text) return '';
  return Array.from(text)
    .map((char) => getPinyinInitialFromChar(char))
    .join('');
}

/**
 * Match details for search results
 */
export interface MatchResult {
  isMatch: boolean;
  matchType: 'phone_last4' | 'phone' | 'pinyin_initial' | 'name' | 'case_number' | 'product_bank' | 'other' | null;
  matchHighlight: string;
}

/**
 * Checks if a search keyword matches a customer record
 */
export function matchCustomer(
  name: string,
  phone: string,
  query: string,
  notes?: string
): MatchResult {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return { isMatch: false, matchType: null, matchHighlight: '' };
  }

  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const last4 = cleanPhone.slice(-4);

  // 1. Check Phone last 4 digits
  if (/^\d{4}$/.test(cleanQuery)) {
    if (last4 === cleanQuery) {
      return {
        isMatch: true,
        matchType: 'phone_last4',
        matchHighlight: `手机后4位 [${last4}] 命中`,
      };
    }
  }

  // 2. Check general phone match
  if (/^\d+$/.test(cleanQuery) && cleanPhone.includes(cleanQuery)) {
    return {
      isMatch: true,
      matchType: 'phone',
      matchHighlight: `手机号包含 [${cleanQuery}]`,
    };
  }

  // 3. Check Chinese name direct inclusion
  if (name && name.toLowerCase().includes(cleanQuery)) {
    return {
      isMatch: true,
      matchType: 'name',
      matchHighlight: `姓名匹配 [${name}]`,
    };
  }

  // 4. Check Pinyin initials (e.g. "zjx" matches "张锦祥")
  const initials = getPinyinInitials(name);
  if (initials && initials.includes(cleanQuery)) {
    return {
      isMatch: true,
      matchType: 'pinyin_initial',
      matchHighlight: `首字母 [${initials}] 匹配 ${name}`,
    };
  }

  // 5. Notes or notes match
  if (notes && notes.toLowerCase().includes(cleanQuery)) {
    return {
      isMatch: true,
      matchType: 'other',
      matchHighlight: `备注信息包含 [${cleanQuery}]`,
    };
  }

  return { isMatch: false, matchType: null, matchHighlight: '' };
}

/**
 * Checks if a search keyword matches a loan case record
 */
export function matchLoanCase(
  caseNumber: string,
  customerName: string,
  customerPhone: string,
  productName: string,
  lenderBank: string,
  query: string
): MatchResult {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return { isMatch: false, matchType: null, matchHighlight: '' };
  }

  const cleanPhone = (customerPhone || '').replace(/[^0-9]/g, '');
  const last4 = cleanPhone.slice(-4);

  // 1. Phone last 4 digits
  if (/^\d{4}$/.test(cleanQuery) && last4 === cleanQuery) {
    return {
      isMatch: true,
      matchType: 'phone_last4',
      matchHighlight: `借款人手机后4位 [${last4}]`,
    };
  }

  // 2. Case number match
  if (caseNumber && caseNumber.toLowerCase().includes(cleanQuery)) {
    return {
      isMatch: true,
      matchType: 'case_number',
      matchHighlight: `进件单号 [${caseNumber}] 匹配`,
    };
  }

  // 3. Customer name match
  if (customerName && customerName.toLowerCase().includes(cleanQuery)) {
    return {
      isMatch: true,
      matchType: 'name',
      matchHighlight: `借款人 [${customerName}] 匹配`,
    };
  }

  // 4. Pinyin initial match on customer name
  const initials = getPinyinInitials(customerName);
  if (initials && initials.includes(cleanQuery)) {
    return {
      isMatch: true,
      matchType: 'pinyin_initial',
      matchHighlight: `首字母 [${initials}] 匹配 ${customerName}`,
    };
  }

  // 5. Product or Bank name match
  if (
    (productName && productName.toLowerCase().includes(cleanQuery)) ||
    (lenderBank && lenderBank.toLowerCase().includes(cleanQuery))
  ) {
    return {
      isMatch: true,
      matchType: 'product_bank',
      matchHighlight: `产品/机构 [${lenderBank || productName}]`,
    };
  }

  return { isMatch: false, matchType: null, matchHighlight: '' };
}
