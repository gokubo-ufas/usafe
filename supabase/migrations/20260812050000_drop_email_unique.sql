-- 社員番号がプライマリキーであり、メールアドレスの一意制約は不要なため削除する
DROP INDEX IF EXISTS employees_email_lower_unique;
