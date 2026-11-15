// MOSTRAR RESULTADOS
function formatDuration(ms) {
    if (ms === null || ms === undefined || ms === '') return '';
    const value = Number(ms);
    if (!Number.isFinite(value) || value < 0) return '';
    return value < 10 ? `${value.toFixed(1)} ms` : `${Math.round(value)} ms`;
}

// FORMATEO DE SQL
function formatSql(sql) {
    let text = String(sql || '').trim();
    if (!text) return '';

    // Protege literales, identificadores entre comillas y comentarios.
    const stringLiterals = [];
    const protect = match => {
        stringLiterals.push(match);
        return `\u0000STR${stringLiterals.length - 1}\u0000`;
    };
    text = text
        .replace(/\/\*[\s\S]*?\*\//g, protect)
        .replace(/--[^\n]*/g, protect)
        .replace(/'(?:''|[^'])*'/g, protect)
        .replace(/"(?:""|[^"])*"/g, protect);

    text = text.replace(/\s+/g, ' ');

    const clauses = [
        'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
        'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'CROSS JOIN', 'JOIN',
        'UNION ALL', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM'
    ];

    clauses.forEach(clause => {
        const words = clause.split(' ').join('\\s+');
        const pattern = new RegExp(`\\s+(${words})\\s+`, 'gi');
        text = text.replace(pattern, `\n$1 `);
    });

    // Evita que "LEFT JOIN" o "INNER JOIN" queden partidos en dos líneas.
    text = text.replace(/\b(LEFT|RIGHT|INNER|CROSS)\nJOIN\b/gi, '$1 JOIN');

    // Las condiciones ON van en una línea indentada.
    text = text.replace(/\s+(ON)\s+/gi, '\n  $1 ');

    const keywordPattern = /\b(select|from|where|group by|order by|having|limit|offset|left join|right join|inner join|cross join|join|on|union all|insert into|values|update|set|delete from|and|or|not|as|distinct|count|avg|sum|min|max|round)\b/gi;
    text = text.replace(keywordPattern, match => match.toUpperCase());
    text = text.replace(/\n{2,}/g, '\n');
    text = text.replace(/[ \t]+\n/g, '\n');
    text = text.replace(/\u0000STR(\d+)\u0000/g, (_, index) => stringLiterals[Number(index)]);

    return text.trim();
}
