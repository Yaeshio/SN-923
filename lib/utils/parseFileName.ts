/**
 * STLファイル名から部品情報を抽出するユーティリティ
 */

export interface ParsedFileInfo {
    /** 元のファイル名 */
    originalFileName: string;
    /** 抽出された部品番号 */
    partNumber: string;
    /** 個数（デフォルト: 1） */
    quantity: number;
    /** 解析が成功したか */
    isValid: boolean;
    /** エラーメッセージ（解析失敗時） */
    errorMessage?: string;
    /** 割り当てられる保管ボックスのリスト */
    storageBoxes?: string[];
}

/**
 * ファイル名から部品番号と個数を抽出する
 * 
 * 対応フォーマット:
 * - PART123.stl → 部品番号: PART123, 個数: 1
 * - PART123_x5.stl → 部品番号: PART123, 個数: 5
 * - PART123_X10.stl → 部品番号: PART123, 個数: 10
 * - ABC-456_x3.stl → 部品番号: ABC-456, 個数: 3
 * 
 * @param fileName - 解析するファイル名（拡張子含む）
 * @returns 解析結果
 */
export function parseFileName(fileName: string): ParsedFileInfo {
    // 拡張子を除去
    const nameWithoutExt = fileName.replace(/\.(stl|STL)$/, '');

    if (!nameWithoutExt) {
        return {
            originalFileName: fileName,
            partNumber: '',
            quantity: 1,
            isValid: false,
            errorMessage: 'ファイル名が空です'
        };
    }

    // パターン1: 部品番号_x個数 または 部品番号_X個数
    const quantityPattern = /^(.+?)_[xX](\d+)$/;
    const match = nameWithoutExt.match(quantityPattern);

    if (match) {
        const partNumber = match[1].trim();
        const quantity = parseInt(match[2], 10);

        if (!partNumber) {
            return {
                originalFileName: fileName,
                partNumber: '',
                quantity: 1,
                isValid: false,
                errorMessage: '部品番号が空です'
            };
        }

        if (quantity <= 0 || quantity > 1000) {
            return {
                originalFileName: fileName,
                partNumber,
                quantity: 1,
                isValid: false,
                errorMessage: `個数が範囲外です（1-1000）: ${quantity}`
            };
        }

        return {
            originalFileName: fileName,
            partNumber,
            quantity,
            isValid: true
        };
    }

    // パターン2: 部品番号のみ（個数指定なし）
    const partNumber = nameWithoutExt.trim();

    if (!partNumber) {
        return {
            originalFileName: fileName,
            partNumber: '',
            quantity: 1,
            isValid: false,
            errorMessage: '部品番号が空です'
        };
    }

    return {
        originalFileName: fileName,
        partNumber,
        quantity: 1,
        isValid: true
    };
}

/**
 * 複数のファイル名を一括解析する
 * 
 * @param fileNames - ファイル名の配列
 * @returns 解析結果の配列
 */
export function parseFileNames(fileNames: string[]): ParsedFileInfo[] {
    return fileNames.map(parseFileName);
}

/**
 * 解析結果から有効なもののみをフィルタリング
 * 
 * @param parsedInfos - 解析結果の配列
 * @returns 有効な解析結果のみの配列
 */
export function filterValidParsedInfos(parsedInfos: ParsedFileInfo[]): ParsedFileInfo[] {
    return parsedInfos.filter(info => info.isValid);
}
