import { join } from 'path';

/**
 * 런타임 폰트 경로.
 * 컴파일 후 이 파일은 dist/src/assets/asset-path.js, 폰트는 nest-cli assets 설정에 의해
 * dist/assets/fonts/ 로 복사됨 → 두 단계 위로 올라가 resolve.
 */
const FONT_DIR = join(__dirname, '..', '..', 'assets', 'fonts');

export const PRETENDARD_REGULAR = join(FONT_DIR, 'Pretendard-Regular.otf');
export const PRETENDARD_BOLD = join(FONT_DIR, 'Pretendard-Bold.otf');
