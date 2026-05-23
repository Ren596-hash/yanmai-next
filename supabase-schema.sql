-- ============================================================
-- 研脉 · Supabase PostgreSQL 数据库迁移脚本
-- 使用: 复制到 Supabase SQL Editor 执行
-- 包含: 12张表 + RLS行级安全 + pgvector向量扩展 + 种子数据
-- ============================================================

-- 启用扩展
CREATE EXTENSION IF NOT EXISTS pgvector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. ENUM类型
-- ============================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('导师', '博士', '硕士', '新生');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('在研', '即将毕业', '已毕业');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE lens_type AS ENUM ('mentor', 'senior', 'reviewer', 'cross');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE visibility_level AS ENUM ('private', 'group', 'alumni', 'public');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE chat_mode_type AS ENUM ('think', 'pitfall', 'debate');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_level_type AS ENUM ('danger', 'warning', 'success');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE path_status AS ENUM ('pending', 'in_progress', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. 建表
-- ============================================================

-- 2.1 profiles (扩展auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role        user_role NOT NULL DEFAULT '新生',
    name        TEXT NOT NULL,
    group_name  TEXT DEFAULT '先进催化材料实验室',
    year        INT DEFAULT 2025,
    mastery     INT DEFAULT 0 CHECK (mastery >= 0 AND mastery <= 100),
    status      user_status DEFAULT '在研',
    style_json  JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_group ON profiles(group_name);

-- 2.2 papers
CREATE TABLE IF NOT EXISTS papers (
    id            SERIAL PRIMARY KEY,
    title         TEXT NOT NULL,
    authors       TEXT,
    journal       TEXT,
    doi           TEXT,
    abstract      TEXT,
    sections_json JSONB DEFAULT '[]',
    tags_json     JSONB DEFAULT '[]',
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_papers_tags ON papers USING GIN (tags_json);
CREATE INDEX IF NOT EXISTS idx_papers_created ON papers(created_at);

-- 2.3 annotations
CREATE TABLE IF NOT EXISTS annotations (
    id                SERIAL PRIMARY KEY,
    paper_id          INT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    anchor_text       TEXT,
    content           TEXT NOT NULL,
    author            TEXT NOT NULL,
    role              lens_type DEFAULT 'senior',
    lens_type         lens_type DEFAULT 'senior',
    has_think_prompt  INT DEFAULT 0,
    think_question    TEXT DEFAULT '',
    visibility        visibility_level DEFAULT 'group',
    confidence        confidence_level DEFAULT 'high',
    confidence_note   TEXT DEFAULT '',
    created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ann_paper ON annotations(paper_id);
CREATE INDEX IF NOT EXISTS idx_ann_author ON annotations(author);
CREATE INDEX IF NOT EXISTS idx_ann_visibility ON annotations(visibility);

-- 2.4 user_annotations
CREATE TABLE IF NOT EXISTS user_annotations (
    id          SERIAL PRIMARY KEY,
    paper_id    INT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES profiles(id),
    anchor_text TEXT NOT NULL,
    content     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ua_paper ON user_annotations(paper_id);
CREATE INDEX IF NOT EXISTS idx_ua_user ON user_annotations(user_id);

-- 2.5 annotation_replies
CREATE TABLE IF NOT EXISTS annotation_replies (
    id              SERIAL PRIMARY KEY,
    annotation_id   INT NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES profiles(id),
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ar_ann ON annotation_replies(annotation_id);

-- 2.6 failures
CREATE TABLE IF NOT EXISTS failures (
    id              SERIAL PRIMARY KEY,
    title           TEXT NOT NULL,
    experimenter    TEXT,
    date            TEXT,
    what            TEXT,
    failure         TEXT,
    why             TEXT,
    lesson          TEXT,
    tags_json       JSONB DEFAULT '[]',
    people_count    INT DEFAULT 1,
    scope           TEXT DEFAULT 'group',
    visibility      visibility_level DEFAULT 'group',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fail_tags ON failures USING GIN (tags_json);
CREATE INDEX IF NOT EXISTS idx_fail_scope ON failures(scope);

-- 2.7 chat_history
CREATE TABLE IF NOT EXISTS chat_history (
    id           SERIAL PRIMARY KEY,
    user_id      UUID REFERENCES profiles(id),
    scene_id     INT,
    question     TEXT NOT NULL,
    answer       TEXT NOT NULL,
    sources_json JSONB DEFAULT '[]',
    mode         chat_mode_type DEFAULT 'think',
    created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ch_user ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ch_created ON chat_history(created_at);

-- 2.8 reading_log
CREATE TABLE IF NOT EXISTS reading_log (
    id            SERIAL PRIMARY KEY,
    user_id       UUID REFERENCES profiles(id),
    paper_id      INT REFERENCES papers(id),
    action        TEXT NOT NULL,
    section_id    TEXT,
    dwell_seconds REAL DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rl_user ON reading_log(user_id);
CREATE INDEX IF NOT EXISTS idx_rl_paper ON reading_log(paper_id);

-- 2.9 newbie_assessments
CREATE TABLE IF NOT EXISTS newbie_assessments (
    id                  SERIAL PRIMARY KEY,
    user_id             UUID REFERENCES profiles(id),
    interests_json      JSONB DEFAULT '[]',
    skills_json         JSONB DEFAULT '{}',
    reading_preference  TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2.10 learning_paths
CREATE TABLE IF NOT EXISTS learning_paths (
    id              SERIAL PRIMARY KEY,
    user_id         UUID REFERENCES profiles(id),
    week_number     INT NOT NULL,
    paper_ids_json  JSONB DEFAULT '[]',
    description     TEXT,
    status          path_status DEFAULT 'pending',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2.11 capsule_assets
CREATE TABLE IF NOT EXISTS capsule_assets (
    id          SERIAL PRIMARY KEY,
    user_id     UUID REFERENCES profiles(id),
    category    TEXT NOT NULL,
    label       TEXT NOT NULL,
    count       INT DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2.12 alerts
CREATE TABLE IF NOT EXISTS alerts (
    id          SERIAL PRIMARY KEY,
    level       alert_level_type NOT NULL,
    content     TEXT NOT NULL,
    is_read     BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2.13 knowledge_chunks (向量存储，pgvector)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id          SERIAL PRIMARY KEY,
    doc_id      TEXT NOT NULL,
    chunk_index INT DEFAULT 0,
    text        TEXT NOT NULL,
    embedding   VECTOR(1024),
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kc_doc ON knowledge_chunks(doc_id);
CREATE INDEX IF NOT EXISTS idx_kc_embedding ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- 3. RLS 行级安全策略
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotation_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE newbie_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE capsule_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- 公开可读的基础数据
CREATE POLICY "papers_public_read" ON papers FOR SELECT USING (true);
CREATE POLICY "annotations_group_read" ON annotations FOR SELECT
    USING (visibility IN ('group', 'alumni', 'public'));
CREATE POLICY "failures_group_read" ON failures FOR SELECT
    USING (visibility IN ('group', 'alumni', 'public'));
CREATE POLICY "alerts_public_read" ON alerts FOR SELECT USING (true);
CREATE POLICY "capsule_public_read" ON capsule_assets FOR SELECT USING (true);
CREATE POLICY "knowledge_chunks_public_read" ON knowledge_chunks FOR SELECT USING (true);

-- profiles: 用户可读所有profiles (Demo简化)
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);

-- 写入策略 (Demo简化，生产环境需结合auth.uid())
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "annotations_insert" ON annotations FOR INSERT WITH CHECK (true);
CREATE POLICY "user_annotations_insert" ON user_annotations FOR INSERT WITH CHECK (true);
CREATE POLICY "annotation_replies_insert" ON annotation_replies FOR INSERT WITH CHECK (true);
CREATE POLICY "chat_history_insert" ON chat_history FOR INSERT WITH CHECK (true);
CREATE POLICY "reading_log_insert" ON reading_log FOR INSERT WITH CHECK (true);
CREATE POLICY "newbie_assessments_insert" ON newbie_assessments FOR INSERT WITH CHECK (true);
CREATE POLICY "learning_paths_insert" ON learning_paths FOR INSERT WITH CHECK (true);

-- ============================================================
-- 4. 种子数据: papers (10篇)
-- ============================================================
INSERT INTO papers (title, authors, journal, doi, abstract, tags_json, sections_json) VALUES
('MoS₂纳米片的缺陷工程调控及光催化性能研究', '陈远, 张明远, 李华',
 'Applied Catalysis B: Environmental, 2024, 342, 123456', '10.1016/j.apcatb.2024.123456',
 '系统探究MoS₂纳米片在不同缺陷浓度下的光催化性能变化。发现缺陷浓度与活性之间为非线性关系，最佳硫空位浓度3.7%。挑战了传统"缺陷越多活性越高"的线性假设。',
 '["MoS₂","缺陷工程","光催化","非线性"]',
 '[["1. Introduction","二维过渡金属硫化物（TMDs）因独特电子结构在光催化领域展现巨大潜力。MoS₂催化活性高度依赖表面缺陷状态。<span class=\"ann-marker\" data-ann=\"1\">缺陷浓度与催化活性的定量关系仍不明确</span>，多数研究停留在定性描述。课题组前期实验注意到缺陷浓度超阈值后活性反降——这一反常现象未被系统研究。"],["2. Experimental","采用CVD法制备MoS₂纳米片，通过<span class=\"ann-marker\" data-ann=\"2\">调节H₂/Ar气氛比例（0.5%-15%）</span>控制硫空位浓度。退火温度400-800°C，每50°C一梯度。注意：退火温度超650°C时MoS₂从2H到1T相变，电学性质剧烈变化。早期忽视此细节，第一批数据不可靠。"],["2.2 Characterization","TEM观察形貌和缺陷结构。Raman光谱E¹₂g和A₁g峰间距评估层数。<span class=\"ann-marker\" data-ann=\"3\">XPS以C 1s 284.8 eV为基准荷电校正</span>，量化硫空位浓度。"],["3. Results","缺陷浓度3.7%的MoS₂产氢速率达1280 μmol·g⁻¹·h⁻¹，是完美晶体8.6倍。<span class=\"ann-marker\" data-ann=\"4\">缺陷浓度超5%后产氢速率急剧下降</span>——过多硫空位形成电子-空穴复合中心。与Wang等人(2023)缺陷越多活性越强结论不一致。经反复验证，Wang等人的缺陷浓度仅覆盖0-3%，恰是我们的上升区间。"],["4. Conclusion","建立了MoS₂缺陷浓度与光催化活性非线性关系模型，<span class=\"ann-marker\" data-ann=\"5\">确定3.7%为最佳硫空位浓度</span>。揭示方法论启示：当文献普适规律与自身数据矛盾时，检查参数范围——规律可能只是局部区间的线性近似。"]]'),

('Cu₂O/TiO₂异质结光催化还原CO₂的界面效应', '王磊, 张明远',
 'ACS Catalysis, 2025, 15, 8901-8912', '10.1021/acscatal.5b02341',
 '构建Cu₂O/TiO₂ II型异质结用于可见光催化还原CO₂。发现界面Cu-O-Ti桥键是电荷转移关键通道。CO₂到CH₄转化率提升17倍。',
 '["异质结","CO₂还原","界面效应","Cu₂O"]',
 '[["1. Introduction","太阳能驱动CO₂转化是解决能源和环境问题的理想策略。TiO₂宽带隙（3.2 eV）限制可见光利用。Cu₂O（带隙2.0 eV）可形成II型异质结。<span class=\"ann-marker\" data-ann=\"6\">异质结界面电荷转移机制仍存争议</span>。"],["2. Experimental","原位沉积法在TiO₂纳米棒上生长Cu₂O。改变Cu²⁺前驱体浓度（5-50 mM）调控负载量。<span class=\"ann-marker\" data-ann=\"7\">关键参数：沉积pH=11.5±0.2，偏离此范围导致Cu₂O氧化为CuO</span>。早期pH波动导致多批样品出现CuO杂相。"]]'),

('单原子Fe-N-C催化剂的ORR活性位点识别', '陈强, 张明远, 王芳',
 'JACS, 2025, 147, 23401-23412', '10.1021/jacs.5c03456',
 '采用原位XAFS和Mössbauer谱联合解析Fe-N-C单原子催化剂在ORR中的真实活性位点。确认Fe-N₄配位结构为活性中心。',
 '["单原子催化","ORR","Fe-N-C","活性位点"]',
 '[["1. Introduction","单原子催化剂(SACs)实现100%原子利用效率。<span class=\"ann-marker\" data-ann=\"8\">Fe-N-C是最有希望替代Pt的非贵金属ORR催化剂</span>，但活性位点确切结构长期存在争议。"],["3. Results","原位XAFS显示ORR工作电位下Fe K-edge XANES出现特征边前峰（7114 eV）。<span class=\"ann-marker\" data-ann=\"9\">Mössbauer双线分裂参数（IS=0.35 mm/s, QS=0.92 mm/s）明确指向Fe(III)-N₄高自旋构型</span>。排除Fe-N₂O₂和Fe₃C可能性。"]]'),

('原位XAFS研究Fe-N-C催化剂在ORR工况下的动态结构演化', '陈强, 王芳',
 'Nature Catalysis, 2025, 8, 567-578', '10.1038/s41929-025-00123',
 '利用operando XAFS追踪Fe-N-C催化剂在ORR过程中的动态结构变化。发现在0.8V vs RHE电位下Fe-N键长从1.98缩短至1.92 Å，证实活性位点的动态响应。',
 '["原位XAFS","ORR","动态结构","operando"]',
 '[["1. Introduction","理解催化剂在工况下的真实结构是理性设计的基础。传统ex-situ表征无法捕捉反应中间态。<span class=\"ann-marker\" data-ann=\"10\">operando XAFS可在反应进行时实时监测活性位点的电子和几何结构</span>。"],["2. Methods","设计原位电化学XAFS池，在ORR条件下（O₂饱和0.1M KOH）同步采集Fe K-edge谱。关键挑战：<span class=\"ann-marker\" data-ann=\"11\">电解液中的气泡会严重干扰X射线信号</span>，采用流动电解液设计解决。"]]'),

('缺陷工程ZnO纳米棒阵列的光电催化性能研究', '李华, 张明远',
 'Journal of Materials Chemistry A, 2024, 12, 8901-8910', '10.1039/d4ta01234',
 '通过氢化处理引入氧空位，系统研究ZnO纳米棒缺陷浓度与光电催化性能关系。发现最佳氧空位浓度为2.3%，PEC电流密度提升4.2倍。',
 '["ZnO","缺陷工程","光电催化","氧空位"]',
 '[["1. Introduction","ZnO是经典光电催化材料但宽带隙限制可见光吸收。<span class=\"ann-marker\" data-ann=\"12\">氧空位可在带隙中引入缺陷能级</span>，扩展光吸收至可见区。但过量氧空位会导致载流子复合加剧。"],["2. Experimental","水热法生长ZnO纳米棒，在不同温度（250-450°C）H₂/Ar气氛中氢化处理引入氧空位。<span class=\"ann-marker\" data-ann=\"13\">关键：氢化温度超过400°C时ZnO表面出现Zn金属颗粒</span>——XRD和XPS确认。"]]'),

('机器学习指导的钙钛矿氧化物催化剂的发现与优化', '王芳, 陈强',
 'ACS Central Science, 2025, 11, 345-356', '10.1021/acscentsci.5c00123',
 '构建包含200+种钙钛矿氧化物的催化性能数据库，训练随机森林和XGBoost模型预测ORR/OER活性。模型筛选的Ba₀.₅Sr₀.₅Co₀.₈Fe₀.₂O₃实验验证活性超越La₀.₆Sr₀.₄CoO₃基准。',
 '["机器学习","钙钛矿","高通量筛选","ORR/OER"]',
 '[["1. Introduction","钙钛矿氧化物组成空间巨大，传统试错法效率极低。<span class=\"ann-marker\" data-ann=\"14\">机器学习可建立组成-结构-性能关系模型</span>，加速新催化剂发现。但数据质量和模型可解释性是关键挑战。"],["2. Methods","从文献和自有实验数据构建训练集。特征工程包括：离子半径、电负性、容忍因子、氧空位形成能。<span class=\"ann-marker\" data-ann=\"15\">注意：文献数据存在严重的阳性结果偏倚——几乎不报道失败的组成</span>，需合成阴性样本补充。"]]'),

('Cu基双金属催化剂电催化CO₂还原的选择性调控', '李华, 王磊',
 'Angewandte Chemie, 2025, 64, e20250123', '10.1002/anie.202501234',
 '通过调控Cu-M (M=Ag, Au, Zn, Sn)双金属纳米颗粒的组成和结构，实现对CO₂电还原产物从C1到C2+的选择性调控。Cu-Ag(9:1)对C₂H₄法拉第效率达72%。',
 '["电催化","CO₂还原","双金属","选择性"]',
 '[["1. Introduction","Cu是唯一能高效催化CO₂→C2+产物的金属，但选择性差。引入第二金属可调控*CO中间体覆盖度和C-C耦合效率。<span class=\"ann-marker\" data-ann=\"16\">双金属的相分离和表面偏析是影响稳定性的关键</span>。"],["2. Experimental","共还原法合成Cu-M纳米颗粒。<span class=\"ann-marker\" data-ann=\"17\">关键发现：合成温度影响合金化程度——室温共还原得到核壳结构而非合金</span>。需60°C以上热注入才能形成均匀合金。"]]'),

('单原子Pt/CeO₂催化剂的水煤气变换反应机理研究', '陈老师, 张明远',
 'ACS Catalysis, 2023, 13, 6789-6800', '10.1021/acscatal.3c00567',
 '结合DFT计算和原位DRIFTS，揭示单原子Pt/CeO₂上WGS反应的完整催化循环。发现Pt-O-Ce界面位点是水解离的关键活性中心，而非Pt原子本身。',
 '["单原子催化","水煤气变换","DFT","原位表征"]',
 '[["1. Introduction","水煤气变换(WGS)是制氢工业关键反应。<span class=\"ann-marker\" data-ann=\"18\">单原子Pt/CeO₂展现出远超纳米颗粒Pt的WGS活性</span>，但活性位点本质长期有争议——是Pt单原子本身还是Pt-CeO₂界面？"],["3. Results","DFT计算表明H₂O分子在Pt单原子上的解离能垒高达1.2 eV，但在Pt-O-Ce界面位点仅0.3 eV。原位DRIFTS确认了<span class=\"ann-marker\" data-ann=\"19\">界面羟基（Ce-OH）是反应关键中间体</span>，而非Pt-OH。"]]'),

('MXene Ti₃C₂Tx基光催化剂用于高效析氢反应', '赵刚, 王芳',
 'Advanced Materials, 2025, 37, 20250156', '10.1002/adma.202501567',
 '利用Ti₃C₂Tx MXene作为助催化剂与CdS复合，实现可见光下高效析氢。优化后产氢速率达14.7 mmol·g⁻¹·h⁻¹，表观量子效率45%@420nm。',
 '["MXene","光催化","析氢","助催化剂"]',
 '[["1. Introduction","MXene家族因其金属级导电性和亲水性成为光催化助催化剂的热门候选。<span class=\"ann-marker\" data-ann=\"20\">Ti₃C₂Tx表面的-F/-O/-OH端基可调节功函数和界面电荷转移</span>。"],["2. Experimental","HF刻蚀Ti₃AlC₂制备Ti₃C₂Tx，超声辅助静电自组装负载CdS纳米颗粒。<span class=\"ann-marker\" data-ann=\"21\">关键警示：MXene在水溶液中不稳定，会逐渐氧化为TiO₂</span>。需在惰性气氛中储存和使用。"]]'),

('钙钛矿氧化物热化学水分解制氢的氧化还原动力学', '王磊, 陈老师',
 'Energy & Environmental Science, 2024, 17, 5678-5690', '10.1039/d4ee01234',
 '系统研究La₁₋ₓSrₓMnO₃系列钙钛矿在两步热化学水分解中的氧交换动力学。发现x=0.3时氧空位形成能与水分解速率达到最佳平衡，产氢量达489 μmol·g⁻¹。',
 '["钙钛矿","热化学","水分解","制氢"]',
 '[["1. Introduction","两步热化学水分解利用太阳热能驱动氧化还原反应制氢，避免贵金属催化剂。<span class=\"ann-marker\" data-ann=\"22\">钙钛矿的氧空位形成能是决定性能的核心参数</span>——太易形成则热还原温度低但水分解驱动力不足。"],["2. Experimental","溶胶-凝胶法制备La₁₋ₓSrₓMnO₃ (x=0-0.5)。热重分析测定氧非化学计量比随温度和pO₂的变化。<span class=\"ann-marker\" data-ann=\"23\">Sr掺杂超过0.3时出现第二相SrMnO₃——XRD确认</span>。"]]');

-- ============================================================
-- 5. 种子数据: annotations (30条)
-- ============================================================
INSERT INTO annotations (paper_id, anchor_text, content, author, role, lens_type, created_at, has_think_prompt, think_question, visibility, confidence, confidence_note) VALUES
(1, '缺陷浓度与催化活性的定量关系仍不明确', '这段在2023年组会上讨论过。我提了一个问题：如果数据不支持"线性"，那支持什么形状？这推动了后来的非线性模型。', '陈老师', 'mentor', 'mentor', '2023-11-01', 1, '在阅读陈老师的观点前——你觉得为什么缺陷浓度和活性不是线性关系？', 'group', 'high', '课题组多次讨论验证'),
(1, '调节H₂/Ar气氛比例（0.5%-15%）', 'H₂/Ar比例要精确控制——第一批用便宜流量计误差±2%，数据完全不可重复。后来换了MFC，不要省这个钱。', '张明远', 'senior', 'senior', '2024-03-15', 0, '', 'group', 'high', '本组3批次实验一致确认'),
(1, 'XPS以C 1s 284.8 eV为基准荷电校正', 'C 1s 284.8 eV是标准做法，但注意CVD样品有石墨碳残留可能有额外C 1s信号。建议同时用Au 4f作为次级标准。', '陈老师', 'mentor', 'mentor', '2024-05-20', 0, '', 'group', 'high', '多位成员独立确认'),
(1, '缺陷浓度超5%后产氢速率急剧下降', '这就是我发现反常的关键节点。第一次看到数据以为操作失误——和文献完全相反。反复验证5次才敢确认。"不符合预期"的数据可能才是最宝贵的。', '张明远', 'senior', 'senior', '2024-02-10', 1, '你在实验中遇到过"和文献相反"的数据吗？当时怎么处理的？', 'group', 'high', '独立重复5次确认'),
(1, '确定3.7%为最佳硫空位浓度', '3.7%不是拍脑袋——做了23个浓度点系统筛选。但最佳值可能依赖制备方法：CVD法和水热法缺陷分布不同。后辈用水热法需重新找最优值。', '陈老师', 'mentor', 'mentor', '2024-07-08', 0, '', 'group', 'medium', '仅CVD法验证，水热法未确认'),
(2, '异质结界面电荷转移机制仍存争议', '界面电荷转移是异质结领域"圣杯"问题。我们核心贡献是找到Cu-O-Ti桥键直接证据——XPS和EXAFS联合指认。读这篇时建议先看Figure 3的XPS数据。', '张明远', 'senior', 'senior', '2025-01-12', 1, '你认为异质结界面的电荷转移机制可能是什么？', 'group', 'high', '多谱学联合验证'),
(2, '关键参数：沉积pH=11.5±0.2，偏离此范围导致Cu₂O氧化为CuO', 'pH控制是成败关键。我花了两周才找到11.5最佳值。低于11生Cu(OH)₂沉淀而非Cu₂O，高于12纳米颗粒过度团聚。用pH计而非试纸——精度差0.2，结果完全不同。', '张明远', 'senior', 'senior', '2024-09-05', 0, '', 'group', 'high', '本组3人独立验证'),
(3, 'Fe-N-C是最有希望替代Pt的非贵金属ORR催化剂', 'Fe-N-C单原子催化剂是2019年以来催化领域最大热点之一。注意——很多人用"单原子"很随意。真正单原子需同时满足：HAADF-STEM孤立亮点+EXAFS无M-M键。', '陈老师', 'mentor', 'mentor', '2025-02-18', 1, '除了XAFS，还有哪些手段可确认单原子配位结构？', 'group', 'high', '领域广泛共识'),
(3, 'Mössbauer双线分裂参数（IS=0.35 mm/s, QS=0.92 mm/s）明确指向Fe(III)-N₄高自旋构型', 'Mössbauer谱解析需专业知识。IS和QS是判断Fe价态和配位环境的核心参数。想用Mössbauer先读Gütlich《Mössbauer Spectroscopy》前3章，否则容易误判。', '陈强', 'senior', 'senior', '2025-04-22', 0, '', 'group', 'medium', '需专业知识解读'),
(4, 'operando XAFS可在反应进行时实时监测活性位点的电子和几何结构', 'operando表征是催化研究的趋势——post-mortem分析只看到"尸体"而不是"活着的"催化剂。注意区分operando（反应条件下同步测）和in-situ（原位但未必同步）。', '陈老师', 'mentor', 'mentor', '2025-03-10', 0, '', 'group', 'high', '领域方法论共识'),
(4, '电解液中的气泡会严重干扰X射线信号', '这是operando电化学XAFS最常见的实验失败原因。我们的流动电解液设计参考了Stanford团队Jaramillo组的工作。气泡不仅挡X射线，还可能导致局部电位偏离设定值。', '陈强', 'senior', 'senior', '2025-04-25', 1, 'operando电化学实验中气泡问题有哪些解决策略？', 'group', 'high', '基于已发表方法+自研改进'),
(5, '氧空位可在带隙中引入缺陷能级', '这是一个被广泛接受但常被过度简化的模型。实际上氧空位引入的是深施主能级还是浅施主能级取决于材料体系和空位浓度。ZnO中氧空位的能级位置仍有争议——部分文献认为在导带下0.3 eV，另一派认为在0.8 eV。', '陈老师', 'mentor', 'mentor', '2024-06-14', 0, '', 'group', 'medium', '领域内有争议'),
(5, '氢化温度超过400°C时ZnO表面出现Zn金属颗粒', '这是张明远MoS₂相变教训的ZnO版本——温度控制不当不只是改变缺陷浓度，还会改变材料相组成。XRD在2θ=36.3°和39.0°出现Zn金属峰（JCPDS 04-0831）。', '李华', 'senior', 'senior', '2024-08-30', 0, '', 'group', 'high', 'XRD+XPS双重确认'),
(6, '机器学习可建立组成-结构-性能关系模型', 'ML在催化中有巨大潜力但要警惕"垃圾进垃圾出"。最大的坑：文献数据的"阳性偏倚"——只发表好的结果，导致模型对失败组成预测能力极差。建议有意识地补充阴性样本。', '陈老师', 'mentor', 'mentor', '2025-05-15', 1, '用机器学习做材料筛选时，数据偏倚可能带来什么问题？', 'group', 'high', '领域普遍认识'),
(6, '文献数据存在严重的阳性结果偏倚——几乎不报道失败的组成', '这就是为什么课题组要记录失败报告——我们自己的阴性数据是训ML模型最宝贵的资源。别人的成功告诉你什么可以做，自己的失败告诉你什么行不通。后者对模型更重要。', '王芳', 'senior', 'senior', '2025-06-20', 0, '', 'group', 'high', '本组实践经验'),
(7, '双金属的相分离和表面偏析是影响稳定性的关键', '双金属催化剂长期稳定性问题常被忽略。在电催化条件下（负电位），表面能较低的金属（如Ag）会向表面富集，改变初始的合金组成。因此不能只表征新鲜催化剂。', '王磊', 'senior', 'senior', '2025-02-28', 0, '', 'group', 'high', '基于operando表征'),
(7, '合成温度影响合金化程度——室温共还原得到核壳结构而非合金', '温度控制对合金形成至关重要。建议在合成后做STEM-EDS元素面扫——很多人跳过这一步直接做催化测试，导致性能不可重复。不同批次"相同"的催化剂可能合金化程度完全不同。', '李华', 'senior', 'senior', '2025-05-08', 1, '你用什么方法确认双金属催化剂是合金还是核壳结构？', 'group', 'high', '多批次独立验证'),
(8, '单原子Pt/CeO₂展现出远超纳米颗粒Pt的WGS活性', '单原子催化剂在WGS中的"超活性"部分来源于金属-载体界面的协同效应——这不是传统催化中的"载体效应"，而是活性位点本身的本质不同。Pt单原子不是"缩小版的Pt纳米颗粒"。', '陈老师', 'mentor', 'mentor', '2023-06-12', 0, '', 'group', 'high', 'DFT+实验联合验证'),
(8, '界面羟基（Ce-OH）是反应关键中间体，而非Pt-OH', '这个结论对催化剂设计有重要指导意义——与其优化Pt本身，不如优化Pt-CeO₂界面密度和氧空位浓度。换个思路：把Pt从"活性中心"重新定位为"界面创造者"。', '张明远', 'senior', 'senior', '2023-08-24', 1, '如果活性中心在界面而非Pt原子，如何最大化界面密度？', 'group', 'medium', '基于DFT+DRIFTS，需更多实验验证'),
(9, 'Ti₃C₂Tx表面的-F/-O/-OH端基可调节功函数和界面电荷转移', 'MXene表面端基调控是近两年研究热点。实验挑战在于：端基种类和比例随合成条件和储存时间变化。同一批MXene放一周后端基组成可能已不同——对可重复性是巨大挑战。', '王芳', 'senior', 'senior', '2025-07-15', 0, '', 'group', 'medium', '领域活跃研究方向'),
(9, '关键警示：MXene在水溶液中不稳定，会逐渐氧化为TiO₂', '这是MXene实际应用的最大障碍之一。Ti₃C₂Tx在水溶液中半衰期约3-5天（取决于pH和溶解氧）。所有水相实验必须在制备后24h内完成。或改用有机溶剂分散。', '赵刚', 'senior', 'senior', '2025-08-10', 1, 'MXene在水中不稳定，有哪些策略可以解决？', 'group', 'high', '本组多次实验验证'),
(10, '钙钛矿的氧空位形成能是决定性能的核心参数', '氧空位形成能可以通过DFT计算获取，但需注意：计算值高度依赖U参数的选择（GGA+U）。DFT-U计算的氧空位形成能误差可达±0.5 eV——这在筛选材料时可能导致排序错误。', '陈老师', 'mentor', 'mentor', '2024-03-20', 1, '计算化学中的参数选择如何影响氧空位形成能预测？', 'group', 'medium', '计算方法固有不确定性'),
(10, 'Sr掺杂超过0.3时出现第二相SrMnO₃', '钙钛矿掺杂有容忍因子极限。Sr²⁺半径（1.44 Å）远大于La³⁺（1.36 Å），掺杂量超限会破坏钙钛矿结构——Goldschmidt容忍因子可预测相稳定性。建议掺杂前计算容忍因子：t=(rA+rO)/√2(rB+rO)，t在0.85-1.05范围稳定。', '王磊', 'senior', 'senior', '2024-05-18', 1, '掺杂钙钛矿时如何预测结构稳定性？', 'group', 'high', '基于晶体化学原理+XRD确认'),
(1, '二维过渡金属硫化物（TMDs）因其独特的电子结构和光学性质', 'TMDs是个大家族——MoS₂只是入门。课题组下一代方向考虑MoSe₂（带隙更窄）和WS₂（迁移率更高）。读这篇时注意方法和思路可以迁移到其他TMDs，但材料参数不能照搬。', '陈老师', 'mentor', 'mentor', '2025-09-01', 0, '', 'group', 'low', '推测性展望'),
(4, 'operando XAFS', '注意XAFS数据处理中的傅里叶变换参数——k权重、窗口函数的选择会显著影响表观键长。统一数据处理流程，否则不同人的XAFS结果无法直接比较。建议全组用同一套Demeter脚本。', '陈强', 'senior', 'senior', '2025-05-12', 0, '', 'group', 'high', '本组数据标准化经验'),
(5, 'ZnO是经典光电催化材料', 'ZnO在光电催化中有一个经典陷阱：紫外光照下ZnO自身会发生光腐蚀——Zn²⁺溶出。很多"光电流衰减"被误判为催化剂失活，实际上是材料自身溶解。做长期稳定性测试前先测电解液中Zn²⁺浓度。', '张明远', 'senior', 'senior', '2024-11-08', 0, '', 'group', 'high', '领域已知问题，本组验证'),
(6, '钙钛矿氧化物组成空间巨大', '高通量实验和ML结合是未来趋势。但这个方向有一个隐形门槛：需要标准化的高通量合成和表征平台——手动一个一个做是走不通的。建议组里投入建设自动化合成站。', '陈老师', 'mentor', 'mentor', '2025-06-30', 1, '高通量实验在催化材料发现中有哪些实践挑战？', 'group', 'medium', '领域趋势判断'),
(8, 'DFT计算', '导师提醒：DFT是工具不是目的。最漂亮的DFT结果如果不能解释实验现象就没有价值。每次做计算前先回答：这个计算回答什么实验问题？结果可以和什么实验数据直接对比？', '陈老师', 'mentor', 'mentor', '2023-09-15', 0, '', 'group', 'high', '导师方法论指导'),
(9, 'CdS纳米颗粒', 'CdS含Cd——有毒。如果要做放大应用，需要评估环保和安全风险。学术界可以做CdS基础研究，但工业界倾向用ZnIn₂S₄或C₃N₄等更环保的替代品。这也是张明远去字节后在做的事——替代有毒材料。', '张明远', 'senior', 'senior', '2025-10-05', 0, '', 'group', 'medium', '工业界实际考量'),
(10, '两步热化学水分解', '热化学制氢的瓶颈不在催化剂活性而在反应器设计——固-固热回收效率决定了全流程经济性。催化背景的人容易忽略工程问题。如有兴趣深入了解，推荐读ETH Steinfeld组的热化学反应器论文。', '陈老师', 'mentor', 'mentor', '2024-08-15', 0, '', 'group', 'medium', '工程视角补充');

-- ============================================================
-- 6. 种子数据: failures (15条)
-- ============================================================
INSERT INTO failures (title, experimenter, date, what, failure, why, lesson, tags_json, people_count, scope, visibility) VALUES
('高温退火导致MoS₂相变失效', '张明远', '2024-01-15', 'CVD生长MoS₂纳米片在750°C下退火2h增加硫空位', '退火后光催化活性下降92%', '750°C超MoS₂ 2H→1T相变温度(~650°C)。1T相导电性好但导带位置不再满足水还原电位。XPS和Raman确认相变。', '退火温度严格控制在650°C以下。需更高温度须在H₂S气氛中稳定2H相。', '["退火","MoS₂","相变","温度"]', 3, 'group', 'group'),
('Cu₂O氧化为CuO导致异质结失效', '张明远', '2024-08-20', '空气中进行Cu₂O/TiO₂异质结后续热处理改善结晶性', '可见光活性几乎消失，CO₂还原产物从CH₄变为痕量CO', '空气中Cu₂O被氧化为CuO。CuO导带位置比TiO₂更正，无法形成有效电荷分离。XRD+XPS确认氧化。', '所有Cu₂O处理步骤须在惰性气氛（Ar/N₂）中进行。必热处理时用真空或Ar/H₂混合气。', '["Cu₂O","氧化","异质结","退火"]', 2, 'group', 'group'),
('pH值波动导致Cu₂O沉积失败', '李华', '2025-03-10', '在TiO₂纳米棒上沉积Cu₂O，NaOH调节pH', '反复出现Cu(OH)₂沉淀或Cu₂O过度团聚，TEM显示粒径从5-10 nm变50-200 nm', '使用试纸判断pH误差约±0.5。实验要求pH=11.5±0.2。张明远原始记录强调pH计必要性但被忽略。', '①使用校准pH计非试纸 ②NaOH加入速度<0.1 mL/min ③每次沉积前重新校准pH计', '["Cu₂O","pH","沉积","方法"]', 1, 'group', 'group'),
('XPS数据分析忽略了石墨碳干扰', '王芳', '2025-06-05', '对CVD生长MoS₂进行XPS分析，C 1s 284.8 eV定标', 'S 2p和Mo 3d峰位与文献值偏差0.3-0.5 eV。硫空位浓度计算值偏高约40%', 'CVD残留石墨碳(峰位284.3 eV)与标定C-C键(284.8 eV)接近但不相同。石墨碳贡献导致校正基准偏移。', 'CVD生长样品建议使用Au 4f(84.0 eV)作为次级内标。', '["XPS","数据分析","MoS₂","CVD"]', 1, 'group', 'group'),
('忽视溶剂效应导致活性测试不可重复', '李华', '2025-08-12', '更换乙腈溶剂供应商后测试MoS₂光电催化性能', '同批样品光电流从1.2 mA/cm²骤降至0.3 mA/cm²，3次测试数据不吻合', '不同供应商乙腈含水量不同（HPLC级10-50 ppm vs ACS级500+ ppm）。痕量水竞争电子产生H₂副反应，降低CO₂还原效率。', '①保持溶剂供应商一致 ②分子筛干燥溶剂 ③每次用Karl Fischer法检测含水量 ④记录溶剂批次', '["溶剂","可重复性","光电催化","CO₂还原"]', 2, 'group', 'group'),
('NaBH₄还原过程中催化剂过度团聚', '陈强', '2025-07-20', '用NaBH₄化学还原法制备Pt纳米颗粒/C', 'TEM显示颗粒粒径从期望3-5 nm变10-30 nm，催化活性仅为预期30%', 'NaBH₄滴加速度过快导致局部还原速率失控——成核和生长阶段分离不充分。一次性加入NaBH₄而非逐滴加入。', '①NaBH₄溶液用注射泵控制滴速0.5 mL/min ②反应液冰浴（0°C） ③加入PVP作为保护剂 ④还原后透析去除过量NaBH₄', '["NaBH₄","纳米颗粒","团聚","合成方法"]', 2, 'group', 'group'),
('TEM电子束损伤导致MoS₂结构误判', '李华', '2025-09-05', '用200kV TEM观察MoS₂纳米片晶格像', '观察到的无序区域被误判为缺陷，但实际上是电子束造成的辐射损伤', 'MoS₂是电子束敏感材料——200kV下几秒内即产生S空位。高分辨像中看到的"缺陷"80%是束致损伤。', '①降低加速电压至80kV ②用低剂量成像模式 ③快速拍照（<5s） ④Cryo-TEM可大幅减少损伤 ⑤对比不同区域的损伤程度', '["TEM","电子束损伤","MoS₂","表征"]', 1, 'group', 'group'),
('电化学阻抗谱拟合电路选择错误', '王芳', '2025-10-15', '用EIS表征光电催化界面电荷转移，使用简单Randles电路拟合', '拟合得到的电荷转移电阻与光电流趋势不一致，R²仅0.85', '实际体系包含两个时间常数（体相+界面），简单Randles电路（1个RC）无法正确描述。忽视了半导体耗尽层电容的贡献。', '①先用Bode图判断时间常数个数 ②两个时间常数用2-RC电路 ③半导体电极需考虑Mott-Schottky响应 ④拟合后用χ²检验合理性', '["EIS","拟合","数据分析","电化学"]', 1, 'group', 'group'),
('水热法合成中Teflon内衬的Si污染', '赵刚', '2025-11-20', '用水热釜180°C合成TiO₂纳米棒', 'EDS检测到产物含0.5-1.0% Si，XPS确认SiO₂存在。来源不明', 'Teflon内衬在使用多次后出现微裂纹，碱性溶液通过裂纹侵蚀了不锈钢外壳中的Si。Si以硅酸盐形式进入产物。', '①定期更换Teflon内衬（>50次使用） ②碱性条件用PPL内衬替代Teflon ③每批空白对照检查 ④产物做EDS全元素扫描', '["水热法","污染","清洗","TiO₂"]', 1, 'field', 'group'),
('光催化测试中染料敏化效应误判', '李华', '2025-04-18', '用亚甲基蓝(MB)作为模型污染物测试ZnO光催化活性', 'MB脱色率很高但TOC去除率很低——染料褪色≠矿化', 'ZnO在可见光下对MB有强吸附+光敏化效应——MB分子吸收光后将电子注入ZnO导带，导致MB自身氧化褪色。这不是真正的光催化，是染料敏化降解。', '①除测UV-Vis吸光度外必测TOC ②用无色模型污染物（苯酚、4-氯酚）做对照 ③在黑暗条件下测吸附平衡 ④报告降解率和矿化率两个指标', '["光催化","染料敏化","数据分析","TOC"]', 2, 'field', 'group'),
('管式炉温区不均导致样品处理不一致', '陈强', '2025-12-05', '用管式炉在500°C H₂/Ar中还原催化剂，多批次间性能差异大', '同条件处理的3批催化剂ORR活性相差±25%，无法解释', '管式炉恒温区仅中间8 cm——不同位置样品实际温度差可达±30°C。多批次放置位置不一致导致还原程度不同。', '①用热电偶实测炉管温度分布确定恒温区 ②样品严格放置在恒温区中心 ③每次用热电偶监控实际温度 ④多批次处理时标记样品位置', '["管式炉","温度","可重复性","设备"]', 1, 'group', 'group'),
('ICP-OES标准曲线未做基质匹配导致定量不准', '王芳', '2026-01-10', '用ICP-OES测定催化剂中Fe含量', '同一样品3次测定RSD达15%，标准加入法结果与标准曲线法相差30%', '样品消解后含高浓度Na和K（来自缓冲溶液），造成电离干扰和基体效应。标准溶液未添加匹配浓度的Na/K。', '①标准溶液基质匹配（加相同浓度Na/K） ②优先用标准加入法定量 ③选不受干扰的谱线 ④加内标（Y或Sc）校正基体效应', '["ICP","定量分析","校准方法","基质效应"]', 1, 'field', 'group'),
('忽略光催化实验中溶液pH的漂移', '赵刚', '2026-02-15', '6h光催化CO₂还原实验，仅记录初始和最终pH', '实验中光电流持续下降被误判为催化剂失活', 'CO₂在水溶液中持续鼓泡会生成碳酸导致pH从6.8降至5.2。pH降低改变CO₂溶解平衡和表面电荷，降低催化效率。实际催化剂未失活，是反应条件漂移。', '①实验中持续监测pH（在线pH计） ②使用缓冲溶液（如NaHCO₃/KHCO₃）稳定pH ③在不同pH下做对照实验 ④区分"催化剂失活"和"反应条件变化"', '["pH","光催化","CO₂还原","实验设计"]', 1, 'group', 'group'),
('SEM-EDS定量时忽视了加速电压选择', '李华', '2026-03-01', '用20kV SEM-EDS定量Cu₂O/TiO₂异质结的Cu/Ti比', '多个区域Cu/Ti比偏差从0.3到1.2，无法确定真实组成', '20kV电子束穿透深度>2μm——实际上同时分析了Cu₂O层和下面TiO₂基底的Ti信号。Cu₂O层仅约100nm厚。', '①降低加速电压至5-8kV（穿透深度<500nm） ②用XPS进行表面定量（检测深度<10nm） ③STEM-EDS进行截面分析 ④电压选择原则：信息深度≈层厚的1/3', '["SEM","EDS","定量分析","纳米结构"]', 1, 'field', 'group'),
('GC-MS分析CO₂还原产物时漏检了液相产物', '赵刚', '2026-03-20', '仅用GC-TCD分析气相产物，认为CO₂还原只产CO和CH₄', '催化效率始终低于文献值，无法解释', 'CO₂电还原可以生成甲酸、甲醇、乙醇等液相产物——仅测气相漏掉了可能占50%法拉第效率的液相产物。', '①气相产物用GC-TCD/FID ②液相产物用HPLC或GC-MS ③同时测气相和液相产物 ④做总法拉第效率平衡（气相+液相应接近100%） ⑤用NMR（¹H和¹³C）确认液相产物结构', '["GC-MS","产物分析","方法遗漏","CO₂还原"]', 1, 'group', 'group');

-- ============================================================
-- 7. 种子数据: profiles (6人)
-- ============================================================
INSERT INTO profiles (name, role, year, mastery, status, style_json) VALUES
('陈远（陈老师）', '导师', 2015, 100, '在研', '{"角色":"课题组PI","研究方向":"催化材料·原位表征","风格":"苏格拉底式引导","核心观点":"数据比假设重要，反常比正常宝贵"}'),
('张明远', '博士', 2020, 95, '即将毕业', '{"实验vs理论":"偏实验派(73%)","广度vs深度":"深度优先","独立vs协作":"独立型","风险偏好":"中等","擅长阶段":"数据分析+反常现象发掘","推荐方向":"催化+AI交叉"}'),
('陈强', '博士', 2024, 72, '在研', '{"实验vs理论":"均衡型(55%)","广度vs深度":"广度优先","独立vs协作":"协作型","风险偏好":"偏低","擅长阶段":"实验方案设计","推荐方向":"多方法联合表征"}'),
('李华', '硕士', 2023, 68, '在研', '{"实验vs理论":"偏实验派(80%)","广度vs深度":"广度优先","独立vs协作":"独立型","风险偏好":"偏高(2份失败报告)","擅长阶段":"快速试错迭代","推荐方向":"需加强理论深度"}'),
('王芳', '硕士', 2024, 31, '在研', '{"实验vs理论":"偏理论派(65%)","广度vs深度":"广度优先","独立vs协作":"协作型","风险偏好":"未知","擅长阶段":"文献调研和数据分析","推荐方向":"建议多跟实验"}'),
('赵刚', '新生', 2025, 5, '在研', '{"实验vs理论":"未知","广度vs深度":"未知","独立vs协作":"未知","风险偏好":"未知","擅长阶段":"待评估","推荐方向":"加载胶囊中"}');

-- ============================================================
-- 8. 种子数据: alerts (7条)
-- ============================================================
INSERT INTO alerts (level, content) VALUES
('danger', '数据标准不一致：3位成员使用不同XPS结合能校准方法。建议本周组会统一标准（Au 4f次级内标）。'),
('warning', '关键文献未读：全组无人阅读MoS₂光催化最新综述(2025, Chem. Rev.)——已自动推送到各成员待读列表。'),
('danger', '方法论分歧：李华与陈强在煅烧温度选择上结论相反(Li认为500°C最优/Chen认为600°C最优)。需导师介入讨论。'),
('danger', '设备隐患预警：管式炉热电偶近3个月未校准。根据历史数据偏差可能达±15°C。建议本周校准。'),
('warning', '知识流失预警：张明远即将毕业(预计2026年6月)，缺陷工程和原位表征两个核心方向的知识尚未完全归档。建议启动知识胶囊打包。'),
('success', '跨代传承良好：第三代学生(王芳/赵刚)对第一代核心方法(CVD制备/MoS₂表征)掌握度达78%。'),
('warning', '文献数据偏倚提醒：组内ML项目使用的训练数据74%来自"成功"实验。阴性样本不足导致模型预测偏差。建议补充失败案例数据。');

-- ============================================================
-- 9. 种子数据: capsule_assets (7条)
-- ============================================================
INSERT INTO capsule_assets (category, label, count) VALUES
('批注', '📝 文献批注', 67),
('失败报告', '⚠️ 失败报告', 5),
('实验记录', '🧪 实验记录', 12),
('组会记录', '📋 组会记录', 8),
('数据分析模板', '📊 数据分析模板', 5),
('毕业去向', '💼 毕业生去向与职业建议', 3),
('个人风格画像', '🔬 科研风格总结', 1);

-- ============================================================
-- 完成
-- ============================================================
-- 验证: SELECT count(*) FROM papers;       -- 期望: 10
-- 验证: SELECT count(*) FROM annotations;  -- 期望: 30
-- 验证: SELECT count(*) FROM failures;     -- 期望: 15
-- 验证: SELECT count(*) FROM profiles;     -- 期望: 6
-- 验证: SELECT count(*) FROM alerts;       -- 期望: 7
