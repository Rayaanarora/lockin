import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Palette
    c_bg = RGBColor(5, 5, 5)          # void black
    c_surface = RGBColor(12, 12, 12)   # dark card surface
    c_raised = RGBColor(20, 20, 20)    # raised element surface
    c_line = RGBColor(32, 32, 32)      # hairline border
    c_line_dim = RGBColor(40, 40, 40)
    c_ink = RGBColor(244, 242, 238)    # off-white
    c_dim = RGBColor(144, 142, 138)    # muted gray
    c_dark = RGBColor(102, 102, 99)    # dark gray
    c_crimson = RGBColor(233, 42, 66)  # signal crimson #e92a42

    font_display = "Space Grotesk"
    font_mono = "JetBrains Mono"

    base_dir = os.path.dirname(os.path.abspath(__file__))
    assets_dir = os.path.join(base_dir, "assets")

    def add_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = c_bg
        bg.line.fill.background()
        return bg

    def add_header(slide, slide_num_str, right_tag_str):
        # Red indicator dot
        dot = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(0.8), Inches(0.55), Inches(0.09), Inches(0.09))
        dot.fill.solid()
        dot.fill.fore_color.rgb = c_crimson
        dot.line.fill.background()

        # Left label
        tb_left = slide.shapes.add_textbox(Inches(0.96), Inches(0.48), Inches(4.5), Inches(0.3))
        tf = tb_left.text_frame
        tf.word_wrap = False
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = f"lockin // vision deck {slide_num_str}"
        p.font.name = font_mono
        p.font.size = Pt(10.5)
        p.font.color.rgb = c_dark

        # Right label
        tb_right = slide.shapes.add_textbox(Inches(8.0), Inches(0.48), Inches(4.533), Inches(0.3))
        tf2 = tb_right.text_frame
        tf2.word_wrap = False
        tf2.margin_left = tf2.margin_top = tf2.margin_right = tf2.margin_bottom = 0
        p2 = tf2.paragraphs[0]
        p2.alignment = PP_ALIGN.RIGHT
        p2.text = right_tag_str
        p2.font.name = font_mono
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = c_dark

    def add_footer(slide, left_str, right_str, right_color=c_crimson):
        # Hairline divider
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(6.8), Inches(11.733), Inches(0.012))
        line.fill.solid()
        line.fill.fore_color.rgb = c_line
        line.line.fill.background()

        # Left text
        tb_left = slide.shapes.add_textbox(Inches(0.8), Inches(6.92), Inches(8.0), Inches(0.3))
        tf = tb_left.text_frame
        tf.word_wrap = False
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = left_str
        p.font.name = font_mono
        p.font.size = Pt(10)
        p.font.color.rgb = c_dark

        # Right text
        tb_right = slide.shapes.add_textbox(Inches(8.5), Inches(6.92), Inches(4.033), Inches(0.3))
        tf2 = tb_right.text_frame
        tf2.word_wrap = False
        tf2.margin_left = tf2.margin_top = tf2.margin_right = tf2.margin_bottom = 0
        p2 = tf2.paragraphs[0]
        p2.alignment = PP_ALIGN.RIGHT
        p2.text = right_str
        p2.font.name = font_mono
        p2.font.size = Pt(10)
        p2.font.color.rgb = right_color

    # =========================================================================
    # SLIDE 1: THE POSSIBILITY
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    add_bg(s1)
    add_header(s1, "01", "[ srm / iitd campus ]")
    add_footer(s1, "four years · thousands of students · countless ideas waiting to happen", "find your people.")

    # Main Headline
    tb_s1 = s1.shapes.add_textbox(Inches(0.8), Inches(2.2), Inches(11.733), Inches(3.2))
    tf1 = tb_s1.text_frame
    tf1.word_wrap = True
    tf1.margin_left = tf1.margin_top = tf1.margin_right = tf1.margin_bottom = 0

    p_head = tf1.paragraphs[0]
    p_head.text = "college is full of possibilities."
    p_head.font.name = font_display
    p_head.font.size = Pt(56)
    p_head.font.bold = True
    p_head.font.color.rgb = c_ink
    p_head.space_after = Pt(24)

    p_sub = tf1.add_paragraph()
    p_sub.text = "but how much of it do we actually do?"
    p_sub.font.name = font_display
    p_sub.font.size = Pt(32)
    p_sub.font.color.rgb = c_dim

    # Crimson accent line
    acc1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(4.1), Inches(1.8), Inches(0.025))
    acc1.fill.solid()
    acc1.fill.fore_color.rgb = c_crimson
    acc1.line.fill.background()

    # Speaker notes
    s1.notes_slide.notes_text_frame.text = (
        "pacing: calm, measured, deliberate. pause for 2 full seconds after advancing to this slide before speaking.\n\n"
        "talking points:\n"
        "• do not introduce the product yet. do not mention features or apps.\n"
        "• connect directly with the student builders in the room: 'everyone in this room chose to be here because you want to make something meaningful during college.'\n"
        "• confront the unspoken campus reality: 'you look around your campus and the potential is staggering. thousands of smart people, hackathons, clubs, labs, ideas sketched in late-night conversations.'\n"
        "• drop the hook: 'yet at the end of four years, most of the things students intended to build never made it past a notes app or a dead group chat.'\n"
        "• transition: 'today we want to talk about why that happens—and what we're building to fix it.'"
    )

    # =========================================================================
    # SLIDE 2: THE PROBLEM
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_bg(s2)
    add_header(s2, "02", "[ the student friction ]")
    add_footer(s2, "friction audit · university life 2026", "find your people.")

    # Section tag
    tag_dot2 = s2.shapes.add_shape(MSO_SHAPE.OVAL, Inches(0.8), Inches(1.22), Inches(0.08), Inches(0.08))
    tag_dot2.fill.solid()
    tag_dot2.fill.fore_color.rgb = c_crimson
    tag_dot2.line.fill.background()

    tb_tag2 = s2.shapes.add_textbox(Inches(0.95), Inches(1.15), Inches(4.0), Inches(0.3))
    tf_tag2 = tb_tag2.text_frame
    tf_tag2.word_wrap = False
    tf_tag2.margin_left = tf_tag2.margin_top = tf_tag2.margin_right = tf_tag2.margin_bottom = 0
    p_t2 = tf_tag2.paragraphs[0]
    p_t2.text = "root cause diagnosis"
    p_t2.font.name = font_mono
    p_t2.font.size = Pt(11)
    p_t2.font.color.rgb = c_crimson

    # Title
    tb_title2 = s2.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(11.733), Inches(0.8))
    tf_title2 = tb_title2.text_frame
    tf_title2.word_wrap = True
    tf_title2.margin_left = tf_title2.margin_top = tf_title2.margin_right = tf_title2.margin_bottom = 0
    p_h2 = tf_title2.paragraphs[0]
    p_h2.text = "good ideas rarely happen on their own."
    p_h2.font.name = font_display
    p_h2.font.size = Pt(36)
    p_h2.font.bold = True
    p_h2.font.color.rgb = c_ink

    # 4 Quadrants (2 columns x 2 rows)
    cards = [
        {
            "num": "01 / talk vs execution",
            "title": "the project you keep talking about but never start",
            "desc": "hackathon ideas and side builds that stall in group chats with 87 messages and zero lines of code."
        },
        {
            "num": "02 / social isolation",
            "title": "the people you want to meet but never quite find",
            "desc": "knowing 50 classmates in large lectures is not the same as having someone on your exact creative wavelength."
        },
        {
            "num": "03 / accountability vacuum",
            "title": "the study session that keeps getting postponed",
            "desc": "promising to study alone in a dorm room, then losing five hours to passive scrolling and fragmented attention."
        },
        {
            "num": "04 / coordination fatigue",
            "title": "the things you want to try but don't want to do alone",
            "desc": "gym workouts, 5km track runs, paper submissions, and side quests that fade without a concrete partner."
        }
    ]

    card_w = Inches(5.72)
    card_h = Inches(1.75)
    xs = [Inches(0.8), Inches(6.81)]
    ys = [Inches(2.45), Inches(4.35)]

    for idx, c in enumerate(cards):
        cx = xs[idx % 2]
        cy = ys[idx // 2]

        card_box = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, cy, card_w, card_h)
        card_box.fill.solid()
        card_box.fill.fore_color.rgb = c_surface
        card_box.line.color.rgb = c_line
        card_box.line.width = Pt(1)

        tb_card = s2.shapes.add_textbox(cx + Inches(0.28), cy + Inches(0.22), card_w - Inches(0.56), card_h - Inches(0.44))
        tf_c = tb_card.text_frame
        tf_c.word_wrap = True
        tf_c.margin_left = tf_c.margin_top = tf_c.margin_right = tf_c.margin_bottom = 0

        p0 = tf_c.paragraphs[0]
        p0.text = c["num"]
        p0.font.name = font_mono
        p0.font.size = Pt(9.5)
        p0.font.color.rgb = c_crimson
        p0.space_after = Pt(6)

        p1 = tf_c.add_paragraph()
        p1.text = c["title"]
        p1.font.name = font_display
        p1.font.size = Pt(14)
        p1.font.bold = True
        p1.font.color.rgb = c_ink
        p1.space_after = Pt(6)

        p2 = tf_c.add_paragraph()
        p2.text = c["desc"]
        p2.font.name = font_display
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = c_dim

    # Bottom summary callout
    bot_callout = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.25), Inches(11.733), Inches(0.42))
    bot_callout.fill.solid()
    bot_callout.fill.fore_color.rgb = RGBColor(9, 9, 9)
    bot_callout.line.color.rgb = RGBColor(40, 20, 24)
    bot_callout.line.width = Pt(1)

    tb_bot = s2.shapes.add_textbox(Inches(0.98), Inches(6.32), Inches(10.0), Inches(0.3))
    tf_b = tb_bot.text_frame
    tf_b.word_wrap = False
    tf_b.margin_left = tf_b.margin_top = tf_b.margin_right = tf_b.margin_bottom = 0
    pb = tf_b.paragraphs[0]
    pb.text = "the barrier isn't ambition: discovery, compatibility, and follow-through are fragmented across dead group chats, stale dms, and disconnected feeds."
    pb.font.name = font_display
    pb.font.size = Pt(10)
    pb.font.color.rgb = c_ink

    tb_bot_r = s2.shapes.add_textbox(Inches(11.2), Inches(6.32), Inches(1.2), Inches(0.3))
    tf_br = tb_bot_r.text_frame
    tf_br.word_wrap = False
    tf_br.margin_left = tf_br.margin_top = tf_br.margin_right = tf_br.margin_bottom = 0
    pbr = tf_br.paragraphs[0]
    pbr.alignment = PP_ALIGN.RIGHT
    pbr.text = "[ 0% output ]"
    pbr.font.name = font_mono
    pbr.font.size = Pt(10)
    pbr.font.color.rgb = c_crimson

    s2.notes_slide.notes_text_frame.text = (
        "pacing: direct, empathetic, diagnosing the exact pain without sounding preachy.\n\n"
        "talking points:\n"
        "• break the myth of lack of motivation: students do not fail to execute because they're lazy; they fail because the friction of coordinating is overwhelmingly high.\n"
        "• walk through the 4 failure modes:\n"
        "  1. talk vs execution: 'everyone has a group chat that was created for a hackathon or a startup idea that died at message 87.'\n"
        "  2. social isolation: 'knowing 50 people in a lecture hall doesn't mean having one person who will sit down and grind a prototype with you on a friday night.'\n"
        "  3. accountability vacuum: 'working alone in a dorm room almost inevitably collapses into scrolling reels or checking discord.'\n"
        "  4. coordination fatigue: 'you want to go for a 5k run or explore a new library, but asking five people feels like a logistical chore.'\n"
        "• conclusion: the campus environment has plenty of ambition, but zero execution infrastructure."
    )

    # =========================================================================
    # SLIDE 3: THE VISION
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_bg(s3)
    add_header(s3, "03", "[ the core thesis ]")
    add_footer(s3, "stop scrolling. start showing up.", "find your people.", right_color=c_crimson)

    # Lockin Logo Mark in center
    mark_path = os.path.join(assets_dir, "lockin_mark.png")
    if os.path.exists(mark_path):
        s3.shapes.add_picture(mark_path, Inches(6.216), Inches(1.35), Inches(0.9), Inches(0.72))

    # Big Headline: find your people.
    tb_h3 = s3.shapes.add_textbox(Inches(0.8), Inches(2.2), Inches(11.733), Inches(0.8))
    tf_h3 = tb_h3.text_frame
    tf_h3.word_wrap = False
    tf_h3.margin_left = tf_h3.margin_top = tf_h3.margin_right = tf_h3.margin_bottom = 0
    ph3 = tf_h3.paragraphs[0]
    ph3.alignment = PP_ALIGN.CENTER
    ph3.text = "find your people."
    ph3.font.name = font_display
    ph3.font.size = Pt(56)
    ph3.font.bold = True
    ph3.font.color.rgb = c_ink

    # Subtitle
    tb_sub3 = s3.shapes.add_textbox(Inches(1.5), Inches(3.1), Inches(10.333), Inches(0.7))
    tf_sub3 = tb_sub3.text_frame
    tf_sub3.word_wrap = True
    tf_sub3.margin_left = tf_sub3.margin_top = tf_sub3.margin_right = tf_sub3.margin_bottom = 0
    psub3 = tf_sub3.paragraphs[0]
    psub3.alignment = PP_ALIGN.CENTER
    psub3.text = "lockin helps you find things to do, people to do them with, and the momentum to actually get started."
    psub3.font.name = font_display
    psub3.font.size = Pt(18)
    psub3.font.color.rgb = c_dim

    # Bottom Container Card: tinder x linkedin
    card3 = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(3.95), Inches(10.933), Inches(2.55))
    card3.fill.solid()
    card3.fill.fore_color.rgb = c_surface
    card3.line.color.rgb = c_line
    card3.line.width = Pt(1)

    # Card Header
    tb_ch3 = s3.shapes.add_textbox(Inches(1.5), Inches(4.15), Inches(6.0), Inches(0.3))
    tf_ch3 = tb_ch3.text_frame
    tf_ch3.word_wrap = False
    tf_ch3.margin_left = tf_ch3.margin_top = tf_ch3.margin_right = tf_ch3.margin_bottom = 0
    pch3 = tf_ch3.paragraphs[0]
    pch3.text = "tinder × linkedin — but for college life."
    pch3.font.name = font_mono
    pch3.font.size = Pt(12)
    pch3.font.color.rgb = c_crimson

    tb_ch3_r = s3.shapes.add_textbox(Inches(7.5), Inches(4.15), Inches(4.333), Inches(0.3))
    tf_ch3_r = tb_ch3_r.text_frame
    tf_ch3_r.word_wrap = False
    tf_ch3_r.margin_left = tf_ch3_r.margin_top = tf_ch3_r.margin_right = tf_ch3_r.margin_bottom = 0
    pch3_r = tf_ch3_r.paragraphs[0]
    pch3_r.alignment = PP_ALIGN.RIGHT
    pch3_r.text = "the discovery + intent equation"
    pch3_r.font.name = font_mono
    pch3_r.font.size = Pt(10.5)
    pch3_r.font.color.rgb = c_dark

    # Hairline divider inside card
    div3 = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.5), Inches(4.5), Inches(10.333), Inches(0.012))
    div3.fill.solid()
    div3.fill.fore_color.rgb = c_line
    div3.line.fill.background()

    # 3 Columns inside Card
    cols3 = [
        {
            "tag": "01 / discovery mechanic",
            "title": "discovery without awkwardness",
            "desc": "borrowing tinder's zero-friction mechanism to find people on your wavelength without cold approaches or social anxiety."
        },
        {
            "tag": "02 / shared intent",
            "title": "alignment around ambition",
            "desc": "borrowing linkedin's project and skill focus: connecting around building, studying, and shipping rather than superficial profiles."
        },
        {
            "tag": "03 / real-world action",
            "title": "turning discovery into doing",
            "desc": "lockin's breakthrough: not another messaging thread, but a shared timer, an in-person check-in, and verified proof of work."
        }
    ]

    col_w = Inches(3.2)
    col_gap = Inches(0.36)
    c_start_x = Inches(1.5)

    for i, col in enumerate(cols3):
        col_x = c_start_x + i * (col_w + col_gap)
        tb_c = s3.shapes.add_textbox(col_x, Inches(4.68), col_w, Inches(1.65))
        tf_c = tb_c.text_frame
        tf_c.word_wrap = True
        tf_c.margin_left = tf_c.margin_top = tf_c.margin_right = tf_c.margin_bottom = 0

        p0 = tf_c.paragraphs[0]
        p0.text = col["tag"]
        p0.font.name = font_mono
        p0.font.size = Pt(9.5)
        p0.font.color.rgb = c_dark
        p0.space_after = Pt(4)

        p1 = tf_c.add_paragraph()
        p1.text = col["title"]
        p1.font.name = font_display
        p1.font.size = Pt(13.5)
        p1.font.bold = True
        p1.font.color.rgb = c_ink
        p1.space_after = Pt(6)

        p2 = tf_c.add_paragraph()
        p2.text = col["desc"]
        p2.font.name = font_display
        p2.font.size = Pt(10)
        p2.font.color.rgb = c_dim

    s3.notes_slide.notes_text_frame.text = (
        "pacing: high clarity, confident conviction, establishing the mental model.\n\n"
        "talking points:\n"
        "• deliver the brand anchor: 'find your people.' pause to let it land.\n"
        "• unpack the core thesis: college life needs an operating system for action.\n"
        "• explain the analogy: 'think about the two consumer products that changed how people discover each other: tinder and linkedin.'\n"
        "• break down the synthesis:\n"
        "  - from tinder, we take low-friction, mutual-intent discovery. you find people who want the same thing right now without the friction of a cold dm.\n"
        "  - from linkedin, we take focus on capability and ambition: what are you studying? what are you building? what skills do you bring?\n"
        "  - but here is the critical difference: neither tinder nor linkedin gets people off screens. lockin ends in physical reality. you don't collect connections—you meet, lock in, and ship."
    )

    # =========================================================================
    # SLIDE 4: THE PRODUCT
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_bg(s4)
    add_header(s4, "04", "[ the live application ]")
    add_footer(s4, "production interface · next.js 15 · supabase realtime · lockin.top", "find your people.")

    # Top title block
    tb_t4 = s4.shapes.add_textbox(Inches(0.8), Inches(1.1), Inches(8.5), Inches(0.9))
    tf_t4 = tb_t4.text_frame
    tf_t4.word_wrap = True
    tf_t4.margin_left = tf_t4.margin_top = tf_t4.margin_right = tf_t4.margin_bottom = 0
    pt4 = tf_t4.paragraphs[0]
    pt4.text = "from intention to action."
    pt4.font.name = font_display
    pt4.font.size = Pt(36)
    pt4.font.bold = True
    pt4.font.color.rgb = c_ink

    psub4 = tf_t4.add_paragraph()
    psub4.text = "the mission is the atomic unit of the product."
    psub4.font.name = font_display
    psub4.font.size = Pt(14)
    psub4.font.color.rgb = c_dim

    # Right badge
    badge4 = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(10.8), Inches(1.2), Inches(1.733), Inches(0.35))
    badge4.fill.solid()
    badge4.fill.fore_color.rgb = RGBColor(28, 10, 14)
    badge4.line.color.rgb = RGBColor(80, 20, 30)
    badge4.line.width = Pt(1)

    tb_b4 = s4.shapes.add_textbox(Inches(10.8), Inches(1.25), Inches(1.733), Inches(0.3))
    tf_b4 = tb_b4.text_frame
    tf_b4.margin_left = tf_b4.margin_top = tf_b4.margin_right = tf_b4.margin_bottom = 0
    pb4 = tf_b4.paragraphs[0]
    pb4.alignment = PP_ALIGN.CENTER
    pb4.text = "● live on lockin.top"
    pb4.font.name = font_mono
    pb4.font.size = Pt(9.5)
    pb4.font.color.rgb = c_crimson

    # 3 Steps with Real UI Screenshots
    steps4 = [
        {
            "step": "step 01",
            "title": "discover",
            "desc": "find missions, categories, study tracks, and real opportunities worth showing up for.",
            "img": os.path.join(assets_dir, "screen_1_discover.png")
        },
        {
            "step": "step 02",
            "title": "do it solo or together",
            "desc": "lock in independently for deep focus, or recruit a builder squad with confirmed check-in slots.",
            "img": os.path.join(assets_dir, "screen_2_collaborate.png")
        },
        {
            "step": "step 03",
            "title": "show up",
            "desc": "execute with a timed sprint, verify in-person attendance, and stack proof to your grit record.",
            "img": os.path.join(assets_dir, "screen_3_execute.png")
        }
    ]

    s_col_w = Inches(3.64)
    s_gap = Inches(0.4)
    s_start_x = Inches(0.8)

    for i, st in enumerate(steps4):
        sx = s_start_x + i * (s_col_w + s_gap)

        # Label block
        tb_st = s4.shapes.add_textbox(sx, Inches(2.1), s_col_w, Inches(1.1))
        tf_st = tb_st.text_frame
        tf_st.word_wrap = True
        tf_st.margin_left = tf_st.margin_top = tf_st.margin_right = tf_st.margin_bottom = 0

        p0 = tf_st.paragraphs[0]
        p0.text = st["step"]
        p0.font.name = font_mono
        p0.font.size = Pt(9.5)
        p0.font.color.rgb = c_crimson
        p0.space_after = Pt(2)

        p1 = tf_st.add_paragraph()
        p1.text = st["title"]
        p1.font.name = font_display
        p1.font.size = Pt(16)
        p1.font.bold = True
        p1.font.color.rgb = c_ink
        p1.space_after = Pt(4)

        p2 = tf_st.add_paragraph()
        p2.text = st["desc"]
        p2.font.name = font_display
        p2.font.size = Pt(10)
        p2.font.color.rgb = c_dim

        # Screen image frame
        if os.path.exists(st["img"]):
            # Add phone mockup screen image (aspect ratio is 9:16 approx)
            # Frame size: width 3.64, height ~3.5
            s4.shapes.add_picture(st["img"], sx, Inches(3.25), width=s_col_w)

    s4.notes_slide.notes_text_frame.text = (
        "pacing: grounded, tactile, authentic. emphasize that this is live code, not a mockup.\n\n"
        "talking points:\n"
        "• show the real product: 'this isn't a figma concept or an investor prototype. this is running in production right now on lockin.top.'\n"
        "• explain the 3-beat product loop:\n"
        "  1. step 01 — discover: you open the feed and see active missions organized by track: academic sprints, hackathon teams, morning gym runs, or deep study sessions.\n"
        "  2. step 02 — solo or squad: lockin supports both solitary discipline and team collaboration. lock in alone to silence distractions, or recruit teammates with explicit roles.\n"
        "  3. step 03 — show up & earn grit: you meet on-site, verify attendance, run a synchronized timer, and log real deliverables. your grit score reflects real execution, not vanity follower counts."
    )

    # =========================================================================
    # SLIDE 5: WHAT LOCKIN COULD BECOME
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_bg(s5)
    add_header(s5, "05", "[ the horizon & invitation ]")
    add_footer(s5, "find your people.", "stop scrolling. start showing up.", right_color=c_crimson)

    # Title block
    tb_t5 = s5.shapes.add_textbox(Inches(0.8), Inches(1.15), Inches(11.733), Inches(0.9))
    tf_t5 = tb_t5.text_frame
    tf_t5.word_wrap = True
    tf_t5.margin_left = tf_t5.margin_top = tf_t5.margin_right = tf_t5.margin_bottom = 0

    pt5 = tf_t5.paragraphs[0]
    pt5.text = "we're building more than an app."
    pt5.font.name = font_display
    pt5.font.size = Pt(36)
    pt5.font.bold = True
    pt5.font.color.rgb = c_ink
    pt5.space_after = Pt(4)

    psub5 = tf_t5.add_paragraph()
    psub5.text = "we're building a place where more things happen."
    psub5.font.name = font_display
    psub5.font.size = Pt(16)
    psub5.font.color.rgb = c_dim

    # 3 Horizon Cards
    horizons5 = [
        {
            "tag": "horizon 01 / grind",
            "title": "learning & productivity",
            "desc": "study groups, midterm blitzes, structured learning challenges, and academic body-doubling that kills procrastination.",
            "pills": ["library sessions", "code sprints", "exam squads"]
        },
        {
            "tag": "horizon 02 / community",
            "title": "people & community",
            "desc": "discovering like-minded peers outside your immediate circle through shared interests, disciplines, and recurring campus rituals.",
            "pills": ["peer discovery", "campus circles", "skill matching"]
        },
        {
            "tag": "horizon 03 / action",
            "title": "missions & experiences",
            "desc": "collaborative hackathons, product launches, athletic trials, and new ways to bring students together in the physical world.",
            "pills": ["hackathons", "track runs", "campus drops"]
        }
    ]

    h_card_w = Inches(3.64)
    h_gap = Inches(0.4)
    h_start_x = Inches(0.8)

    for i, h in enumerate(horizons5):
        hx = h_start_x + i * (h_card_w + h_gap)
        hy = Inches(2.35)

        card_box = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, hx, hy, h_card_w, Inches(3.1))
        card_box.fill.solid()
        card_box.fill.fore_color.rgb = c_surface
        card_box.line.color.rgb = c_line
        card_box.line.width = Pt(1)

        tb_hc = s5.shapes.add_textbox(hx + Inches(0.25), hy + Inches(0.25), h_card_w - Inches(0.5), Inches(2.6))
        tf_hc = tb_hc.text_frame
        tf_hc.word_wrap = True
        tf_hc.margin_left = tf_hc.margin_top = tf_hc.margin_right = tf_hc.margin_bottom = 0

        p0 = tf_hc.paragraphs[0]
        p0.text = h["tag"]
        p0.font.name = font_mono
        p0.font.size = Pt(9.5)
        p0.font.color.rgb = c_crimson
        p0.space_after = Pt(8)

        p1 = tf_hc.add_paragraph()
        p1.text = h["title"]
        p1.font.name = font_display
        p1.font.size = Pt(16)
        p1.font.bold = True
        p1.font.color.rgb = c_ink
        p1.space_after = Pt(8)

        p2 = tf_hc.add_paragraph()
        p2.text = h["desc"]
        p2.font.name = font_display
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = c_dim
        p2.space_after = Pt(16)

        p3 = tf_hc.add_paragraph()
        p3.text = " · ".join([f"[{p}]" for p in h["pills"]])
        p3.font.name = font_mono
        p3.font.size = Pt(8.5)
        p3.font.color.rgb = c_dark

    # Invitation Banner at bottom
    inv_box = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.65), Inches(11.733), Inches(0.95))
    inv_box.fill.solid()
    inv_box.fill.fore_color.rgb = RGBColor(9, 9, 9)
    inv_box.line.color.rgb = c_line
    inv_box.line.width = Pt(1)

    # Logo Mark in invitation banner
    if os.path.exists(mark_path):
        s5.shapes.add_picture(mark_path, Inches(1.1), Inches(5.8), Inches(0.6), Inches(0.48))

    # Text in invitation banner
    tb_inv = s5.shapes.add_textbox(Inches(1.85), Inches(5.78), Inches(8.0), Inches(0.7))
    tf_inv = tb_inv.text_frame
    tf_inv.word_wrap = True
    tf_inv.margin_left = tf_inv.margin_top = tf_inv.margin_right = tf_inv.margin_bottom = 0

    pi0 = tf_inv.paragraphs[0]
    pi0.text = "help us build what comes next."
    pi0.font.name = font_display
    pi0.font.size = Pt(13)
    pi0.font.bold = True
    pi0.font.color.rgb = c_ink
    pi0.space_after = Pt(2)

    pi1 = tf_inv.add_paragraph()
    pi1.text = "we're inviting the builders in this room to launch missions, test prototypes, and shape the campus platform."
    pi1.font.name = font_display
    pi1.font.size = Pt(9.5)
    pi1.font.color.rgb = c_dim

    # Right CTA box
    cta_box = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(10.7), Inches(5.9), Inches(1.6), Inches(0.42))
    cta_box.fill.solid()
    cta_box.fill.fore_color.rgb = RGBColor(28, 10, 14)
    cta_box.line.color.rgb = RGBColor(80, 20, 30)
    cta_box.line.width = Pt(1)

    tb_cta = s5.shapes.add_textbox(Inches(10.7), Inches(5.98), Inches(1.6), Inches(0.3))
    tf_cta = tb_cta.text_frame
    tf_cta.margin_left = tf_cta.margin_top = tf_cta.margin_right = tf_cta.margin_bottom = 0
    pcta = tf_cta.paragraphs[0]
    pcta.alignment = PP_ALIGN.CENTER
    pcta.text = "lockin.top"
    pcta.font.name = font_mono
    pcta.font.size = Pt(10.5)
    pcta.font.color.rgb = c_crimson

    s5.notes_slide.notes_text_frame.text = (
        "pacing: inspiring, open, collegiate, non-transactional. close with conviction.\n\n"
        "talking points:\n"
        "• reframe the entire presentation: 'we didn't ask you here to pitch an app. we asked you here because campus culture is shaped by builders.'\n"
        "• map out the 3 horizons of what lockin is becoming:\n"
        "  1. grind: replacing procrastination with shared focus and academic momentum.\n"
        "  2. community: breaking the social bubble so engineers meet designers, freshmen meet senior builders, and genuine friendships form through doing.\n"
        "  3. missions: turning college into an open arena of challenges, hackathons, physical feats, and campus rituals.\n"
        "• direct call to action: 'we want you to run the first missions on your campus. take lockin, test it, find bugs, launch your project squad on it, and build this with us.'\n"
        "• end on: 'stop scrolling. start showing up. find your people at lockin.top.'"
    )

    out_path = os.path.join(base_dir, "..", "lockin_vision_deck.pptx")
    prs.save(out_path)
    print(f"saved pptx to: {os.path.abspath(out_path)}")

if __name__ == "__main__":
    create_deck()
