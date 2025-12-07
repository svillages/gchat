<?php
$SET_SITE_ROOT  = dirname(__FILE__);	// site home 절대경로
define('VERSION', rand());

// 비밀번호 해싱 설정
define('PASSWORD_ALGO', PASSWORD_ARGON2ID); // PHP 7.2+에서는 ARGON2ID 권장
define('PASSWORD_OPTIONS', [
    'memory_cost' => 1024 * 64, // 64MB
    'time_cost'   => 4,
    'threads'     => 3,
]);

// 세션 설정
session_start();
//토큰 생성
if (empty($_SESSION['csrf_token'])) {
    if (function_exists('random_bytes')) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    } else {
        $_SESSION['csrf_token'] = bin2hex(openssl_random_pseudo_bytes(32));
    }
}

// 언어 코드 매핑
$language_map = [
    // Korean
    'ko-KR' => ['name' => '한국어', 'flag' => '🇰🇷'],
    // Chinese
    'zh-CN' => ['name' => '中文 (简体)', 'flag' => '🇨🇳'],
    'zh-HK' => ['name' => '中文 (繁體)', 'flag' => '🇭🇰'],
    'zh-TW' => ['name' => '中文 (繁體)', 'flag' => '🇹🇼'],
    // Japanese
    'ja-JP' => ['name' => '日本語', 'flag' => '🇯🇵'],
    // English
    'en-US' => ['name' => 'English', 'flag' => '🇺🇸'],
    // Spanish
    'es-ES' => ['name' => 'Español', 'flag' => '🇪🇸'],
    // French
    'fr-FR' => ['name' => 'Français', 'flag' => '🇫🇷'],
    // 몽골 (Mongolia)
    'mn-MN' => ['name' => 'Монгол', 'flag' => '🇲🇳'],
    // Vietnamese
    'vi-VN' => ['name' => 'Tiếng Việt', 'flag' => '🇻🇳'],
    // Thai
    'th-TH' => ['name' => 'ไทย', 'flag' => '🇹🇭'],
    // 라오스 (Laos)
    'lo-LA' => ['name' => 'ລາວ', 'flag' => '🇱🇦'],
    
    // Afrikaans
    'af-ZA' => ['name' => 'Afrikaans', 'flag' => '🇿🇦'],
    // Arabic (All mapped to 'العربية' with specific country flags)
    'ar-AE' => ['name' => 'العربية', 'flag' => '🇦🇪'],
    'ar-BH' => ['name' => 'العربية', 'flag' => '🇧🇭'],
    'ar-DZ' => ['name' => 'العربية', 'flag' => '🇩🇿'],
    'ar-EG' => ['name' => 'العربية', 'flag' => '🇪🇬'],
    'ar-IQ' => ['name' => 'العربية', 'flag' => '🇮🇶'],
    'ar-JO' => ['name' => 'العربية', 'flag' => '🇯🇴'],
    'ar-KW' => ['name' => 'العربية', 'flag' => '🇰🇼'],
    'ar-LB' => ['name' => 'العربية', 'flag' => '🇱🇧'],
    'ar-MA' => ['name' => 'العربية', 'flag' => '🇲🇦'],
    'ar-OM' => ['name' => 'العربية', 'flag' => '🇴🇲'],
    'ar-QA' => ['name' => 'العربية', 'flag' => '🇶🇦'],
    'ar-SA' => ['name' => 'العربية', 'flag' => '🇸🇦'],
    'ar-SY' => ['name' => 'العربية', 'flag' => '🇸🇾'],
    'ar-TN' => ['name' => 'العربية', 'flag' => '🇹🇳'],
    'ar-YE' => ['name' => 'العربية', 'flag' => '🇾🇪'],
    // Bulgarian
    'bg-BG' => ['name' => 'Български', 'flag' => '🇧🇬'],
    // Catalan
    'ca-ES' => ['name' => 'Català', 'flag' => '🇪🇸'],
    // Czech
    'cs-CZ' => ['name' => 'Čeština', 'flag' => '🇨🇿'],
    // Danish
    'da-DK' => ['name' => 'Dansk', 'flag' => '🇩🇰'],
    // German
    'de-AT' => ['name' => 'Deutsch', 'flag' => '🇦🇹'],
    'de-CH' => ['name' => 'Deutsch', 'flag' => '🇨🇭'],
    'de-DE' => ['name' => 'Deutsch', 'flag' => '🇩🇪'],
    'de-LU' => ['name' => 'Deutsch', 'flag' => '🇱🇺'],
    // Greek
    'el-GR' => ['name' => 'Ελληνικά', 'flag' => '🇬🇷'],
    // English
    'en-AU' => ['name' => 'English', 'flag' => '🇦🇺'],
    'en-CA' => ['name' => 'English', 'flag' => '🇨🇦'],
    'en-GB' => ['name' => 'English', 'flag' => '🇬🇧'],
    'en-IE' => ['name' => 'English', 'flag' => '🇮🇪'],
    'en-IN' => ['name' => 'English', 'flag' => '🇮🇳'],
    'en-NZ' => ['name' => 'English', 'flag' => '🇳🇿'],
    'en-US' => ['name' => 'English', 'flag' => '🇺🇸'],
    'en-ZA' => ['name' => 'English', 'flag' => '🇿🇦'],
    'en-ZM' => ['name' => 'English', 'flag' => '🇿🇲'],
    // Spanish
    'es-AR' => ['name' => 'Español', 'flag' => '🇦🇷'],
    'es-BO' => ['name' => 'Español', 'flag' => '🇧🇴'],
    'es-CL' => ['name' => 'Español', 'flag' => '🇨🇱'],
    'es-CO' => ['name' => 'Español', 'flag' => '🇨🇴'],
    'es-CR' => ['name' => 'Español', 'flag' => '🇨🇷'],
    'es-DO' => ['name' => 'Español', 'flag' => '🇩🇴'],
    'es-EC' => ['name' => 'Español', 'flag' => '🇪🇨'],
    'es-GT' => ['name' => 'Español', 'flag' => '🇬🇹'],
    'es-HN' => ['name' => 'Español', 'flag' => '🇭🇳'],
    'es-MX' => ['name' => 'Español', 'flag' => '🇲🇽'],
    'es-NI' => ['name' => 'Español', 'flag' => '🇳🇮'],
    'es-PA' => ['name' => 'Español', 'flag' => '🇵🇦'],
    'es-PE' => ['name' => 'Español', 'flag' => '🇵🇪'],
    'es-PR' => ['name' => 'Español', 'flag' => '🇵🇷'],
    'es-PY' => ['name' => 'Español', 'flag' => '🇵🇾'],
    'es-SV' => ['name' => 'Español', 'flag' => '🇸🇻'],
    'es-UY' => ['name' => 'Español', 'flag' => '🇺🇾'],
    'es-VE' => ['name' => 'Español', 'flag' => '🇻🇪'],
    // Estonian
    'et-EE' => ['name' => 'Eesti', 'flag' => '🇪🇪'],
    // Persian (Farsi)
    'fa-IR' => ['name' => 'فارسی', 'flag' => '🇮🇷'],
    // Finnish
    'fi-FI' => ['name' => 'Suomi', 'flag' => '🇫🇮'],
    // French
    'fr-BE' => ['name' => 'Français', 'flag' => '🇧🇪'],
    'fr-CA' => ['name' => 'Français', 'flag' => '🇨🇦'],
    'fr-CH' => ['name' => 'Français', 'flag' => '🇨🇭'],
 
    'fr-LU' => ['name' => 'Français', 'flag' => '🇱🇺'],
    // Hebrew
    'he-IL' => ['name' => 'עברית', 'flag' => '🇮🇱'],
    // Hindi
    'hi-IN' => ['name' => 'हिन्दी', 'flag' => '🇮🇳'],
    // Croatian
    'hr-HR' => ['name' => 'Hrvatski', 'flag' => '🇭🇷'],
    // Hungarian
    'hu-HU' => ['name' => 'Magyar', 'flag' => '🇭🇺'],
    // Indonesian
    'id-ID' => ['name' => 'Bahasa Indonesia', 'flag' => '🇮🇩'],
    // Italian
    'it-CH' => ['name' => 'Italiano', 'flag' => '🇨🇭'],
    'it-IT' => ['name' => 'Italiano', 'flag' => '🇮🇹'],
    // Lithuanian
    'lt-LT' => ['name' => 'Lietuvių', 'flag' => '🇱🇹'],
    // Latvian
    'lv-LV' => ['name' => 'Latviešu', 'flag' => '🇱🇻'],
    // Malay
    'ms-MY' => ['name' => 'Bahasa Melayu', 'flag' => '🇲🇾'],
    // Norwegian Bokmål
    'nb-NO' => ['name' => 'Norsk bokmål', 'flag' => '🇳🇴'],
    // Dutch
    'nl-BE' => ['name' => 'Nederlands', 'flag' => '🇧🇪'],
    'nl-NL' => ['name' => 'Nederlands', 'flag' => '🇳🇱'],
    // Polish
    'pl-PL' => ['name' => 'Polski', 'flag' => '🇵🇱'],
    // Portuguese
    'pt-BR' => ['name' => 'Português', 'flag' => '🇧🇷'],
    'pt-PT' => ['name' => 'Português', 'flag' => '🇵🇹'],
    // Romanian
    'ro-RO' => ['name' => 'Română', 'flag' => '🇷🇴'],
    // Russian
    'ru-RU' => ['name' => 'Русский', 'flag' => '🇷🇺'],
    // Slovak
    'sk-SK' => ['name' => 'Slovenčina', 'flag' => '🇸🇰'],
    // Slovenian
    'sl-SI' => ['name' => 'Slovenščina', 'flag' => '🇸🇮'],
    // Swedish
    'sv-SE' => ['name' => 'Svenska', 'flag' => '🇸🇪'],
    // Turkish
    'tr-TR' => ['name' => 'Türkçe', 'flag' => '🇹🇷'],
    // Ukrainian
    'uk-UA' => ['name' => 'Українська', 'flag' => '🇺🇦'],
    

];

// 사용자 인증 체크
function checkAuth() {
    if (!isset($_SESSION['user_id'])) {
        header('Location: /member/login');
        exit;
    }
}
?>