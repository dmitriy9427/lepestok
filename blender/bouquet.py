"""
Букет «Утро в Провансе» для первого экрана — процедурная модель в Blender.

Запуск (из корня проекта):
    blender -b --python blender/bouquet.py
Результат:
    blender/bouquet.glb         — модель (glTF) для three.js
    blender/bouquet.blend       — сцена: откройте в Blender, покрутите, поменяйте
    blender/preview.png         — картинка-превью

Как устроено (сверху вниз — от мелкого к крупному):
  1. petal()      — один лепесток: сетка вершин, изогнутая «ложкой», с волной по краю
                    и градиентом цвета (тёмный у основания, светлый на кончике).
  2. peony()/rose()/leaf — цветок = много лепестков, повёрнутых по кругу и
                    раскрытых тем сильнее, чем дальше от центра.
  3. bouquet      — головки расставлены по куполу (спираль подсолнуха), под ними
                    стебли, вокруг — листы плёнки конусом, внизу бант.
  4. экспорт      — GLB. Одинаковые цветы — ОДИН меш на несколько объектов
                    (linked duplicates): файл в разы меньше.

Всё случайное — от seed: перезапуск даёт ту же модель.
Хотите другой букет — меняйте константы в разделе «Настройки».
"""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_GLB = os.path.join(ROOT, 'blender', 'bouquet.glb')
OUT_BLEND = os.path.join(ROOT, 'blender', 'bouquet.blend')
OUT_PNG = os.path.join(ROOT, 'blender', 'preview.png')

# ─── Настройки ──────────────────────────────────────────────────────────────
SEED = 7
HEADS = 15  # пионов в букете
DOME_RADIUS = 1.15  # радиус «купола» из головок
DOME_CENTER_Z = 2.0
PEONY_COLORS = [  # (основание, кончик) — RGB 0..1, линейные значения
    ((0.40, 0.03, 0.12), (0.92, 0.38, 0.52)),
    ((0.48, 0.05, 0.16), (0.97, 0.48, 0.60)),
    ((0.35, 0.02, 0.10), (0.85, 0.30, 0.46)),
]
WRAP_COLOR = (0.62, 0.40, 0.45)  # матовая пудровая плёнка
RIBBON_COLOR = (0.55, 0.16, 0.24)
LEAF_COLOR = ((0.20, 0.30, 0.24), (0.45, 0.56, 0.48))
STEM_COLOR = (0.22, 0.35, 0.18)

rnd = random.Random(SEED)


# ─── Утилиты ────────────────────────────────────────────────────────────────
def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, color=None, roughness=0.6, sheen=0.0, use_vertex_color=False, double_sided=True):
    """Principled BSDF. С вертексными цветами базовый цвет берётся из атрибута
    «Col» (его же экспортер положит в glTF как COLOR_0)."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.use_backface_culling = not double_sided  # → doubleSided в glTF
    nodes = mat.node_tree.nodes
    bsdf = nodes.get('Principled BSDF')
    bsdf.inputs['Roughness'].default_value = roughness
    if 'Sheen Weight' in bsdf.inputs:
        bsdf.inputs['Sheen Weight'].default_value = sheen
    if use_vertex_color:
        attr = nodes.new('ShaderNodeVertexColor')
        attr.layer_name = 'Col'
        mat.node_tree.links.new(attr.outputs['Color'], bsdf.inputs['Base Color'])
    elif color:
        bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    return mat


def mesh_object(name, bm, mat, collection):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for poly in me.polygons:
        poly.use_smooth = True
    me.materials.append(mat)
    obj = bpy.data.objects.new(name, me)
    collection.objects.link(obj)
    return obj


def add_petal(bm, col_layer, matrix, length, width, cup, curl, ruffle, base_color, tip_color, rows=8, cols=8, tip=0.6):
    """Один лепесток в bmesh. В своих координатах растёт по +Y от (0,0,0),
    лежит в плоскости XY. matrix ставит лепесток на место.

    Форма — «ложка»: ширина по эллипсу с центром в tip (доля длины).
      tip=0.5 — кончик закрыт и скруглён (роза);
      tip=0.6 — кончик срезан (ширина там ~0.75) — волнистый край, как у пиона.
    cup — края загнуты вверх, curl — кончик загибается (минус — наружу),
    ruffle — волна по верхнему краю.
    Цвет вершин — градиент от base_color у основания к tip_color на кончике."""
    phase = rnd.uniform(0, math.tau)
    grid = []
    for i in range(rows + 1):
        u = i / rows
        w = width * math.sqrt(max(0.0, 1 - ((u - tip) / tip) ** 2))
        row = []
        for j in range(cols + 1):
            v = j / cols * 2 - 1
            edge = u ** 4  # волна — в основном у верхнего края
            x = v * w
            y = length * u + ruffle * math.cos(v * 5 + phase) * edge * length * 0.06
            z = cup * v * v * w + curl * u * u * length
            z += ruffle * math.sin(v * 8 + phase) * edge * length * 0.1
            vert = bm.verts.new(matrix @ Vector((x, y, z)))
            row.append((vert, u))
        grid.append(row)
    for i in range(rows):
        for j in range(cols):
            a, b = grid[i][j], grid[i][j + 1]
            c, d = grid[i + 1][j + 1], grid[i + 1][j]
            face = bm.faces.new((a[0], b[0], c[0], d[0]))
            for loop in face.loops:
                u = next(uu for vv, uu in (a, b, c, d) if vv is loop.vert)
                t = u ** 0.7
                color = [base_color[k] * (1 - t) + tip_color[k] * t for k in range(3)]
                loop[col_layer] = (*color, 1.0)


def new_bmesh():
    bm = bmesh.new()
    col = bm.loops.layers.color.new('Col')
    return bm, col


def petal_matrix(phi, open_deg, radius, height=0.0, roll=0.0):
    """Поворот вокруг оси цветка на phi, отступ от центра, раскрытие
    (0° — лепесток стоит вертикально, 90° — лежит)."""
    return (
        Matrix.Rotation(phi, 4, 'Z')
        @ Matrix.Translation((0, radius, height))
        @ Matrix.Rotation(math.radians(90 - open_deg), 4, 'X')
        @ Matrix.Rotation(roll, 4, 'Y')
    )


def sweep(bm, points, width, thickness):
    """Лента вдоль ломаной points: в каждой точке — прямоугольное сечение
    width × thickness, повёрнутое по направлению кривой. Соседние сечения
    соединяются гранями. Так делают ленты, провода, рамки."""
    rings = []
    for k, p in enumerate(points):
        nxt = points[min(k + 1, len(points) - 1)]
        prv = points[max(k - 1, 0)]
        tangent = (nxt - prv).normalized()
        side = tangent.cross(Vector((0, -1, 0)))
        if side.length < 1e-4:
            side = tangent.cross(Vector((0, 0, 1)))
        side.normalize()
        normal = side.cross(tangent).normalized()
        corners = [(-1, -1), (1, -1), (1, 1), (-1, 1)]
        rings.append([bm.verts.new(p + side * (sx * width / 2) + normal * (sy * thickness / 2)) for sx, sy in corners])
    for a, b in zip(rings, rings[1:]):
        for i in range(4):
            bm.faces.new((a[i], a[(i + 1) % 4], b[(i + 1) % 4], b[i]))


# ─── Цветы ──────────────────────────────────────────────────────────────────
def peony_mesh(name, colors, mat, collection):
    """Пион: плотная середина из маленьких стоячих лепестков, вокруг —
    крупные, раскрытые всё сильнее. Волна по краю — «махровость»."""
    bm, col = new_bmesh()
    base, tip = colors
    rings = [
        # (кол-во, длина, ширина, раскрытие°, радиус, высота, cup, curl, ruffle)
        (16, 0.26, 0.20, 8, 0.03, 0.16, 1.3, 0.10, 1.0),   # середина — тугой «мячик»
        (14, 0.36, 0.28, 22, 0.06, 0.11, 1.1, 0.06, 1.0),
        (13, 0.46, 0.36, 40, 0.10, 0.06, 0.9, 0.0, 0.9),
        (11, 0.56, 0.45, 60, 0.14, 0.02, 0.7, -0.06, 0.8),
        (9, 0.64, 0.52, 82, 0.18, -0.02, 0.5, -0.14, 0.7),  # внешние — почти лежат
    ]
    for count, length, width, open_deg, radius, height, cup, curl, ruffle in rings:
        offset = rnd.uniform(0, math.tau)
        for k in range(count):
            phi = offset + k / count * math.tau + rnd.uniform(-0.15, 0.15)
            m = petal_matrix(phi, open_deg + rnd.uniform(-6, 6), radius, height, rnd.uniform(-0.2, 0.2))
            add_petal(bm, col, m, length * rnd.uniform(0.9, 1.1), width, cup, curl, ruffle, base, tip)
    return mesh_object(name, bm, mat, collection)


def rose_mesh(name, colors, mat, collection):
    """Роза: лепестки по спирали (золотой угол), от тугого бутона к открытым."""
    bm, col = new_bmesh()
    base, tip = colors
    count = 22
    for k in range(count):
        t = k / (count - 1)
        phi = k * math.radians(137.5)
        open_deg = 5 + t * 70
        m = petal_matrix(phi, open_deg, 0.02 + t * 0.1, 0.12 - t * 0.12)
        add_petal(bm, col, m, 0.28 + t * 0.32, 0.18 + t * 0.2, 1.4 - t * 0.6, -0.2 * t, 0.3, base, tip)
    return mesh_object(name, bm, mat, collection)


def eucalyptus_mesh(name, mat, collection):
    """Ветка эвкалипта: круглые листья парами вдоль стебля (стебель — отдельно)."""
    bm, col = new_bmesh()
    base, tip = LEAF_COLOR
    for i in range(8):
        t = i / 8
        size = 0.22 * (1 - t * 0.5)
        for side in (-1, 1):
            m = (
                Matrix.Translation((0, 0, t * 1.4))
                @ Matrix.Rotation(side * math.radians(70), 4, 'Y')
                @ Matrix.Rotation(math.radians(-80), 4, 'X')
            )
            add_petal(bm, col, m, size, size * 0.7, 0.15, 0.0, 0.0, base, tip, rows=4, cols=4)
    return mesh_object(name, bm, mat, collection)


# ─── Сцена ──────────────────────────────────────────────────────────────────
def dome_points(count):
    """Точки на сферическом «куполе» по спирали подсолнуха + нормаль наружу."""
    golden = math.pi * (3 - math.sqrt(5))
    out = []
    for i in range(count):
        t = (i + 0.5) / count
        polar = math.acos(1 - t * 0.85)  # 0 — макушка, ~80° — край купола
        az = i * golden
        n = Vector((math.sin(polar) * math.cos(az), math.sin(polar) * math.sin(az), math.cos(polar)))
        p = Vector((0, 0, DOME_CENTER_Z - DOME_RADIUS * 0.55)) + n * DOME_RADIUS
        out.append((p, n))
    return out


def look_rotation(direction, axis='Z'):
    """Поворот, при котором ось объекта смотрит по direction.
    Цветок растёт по +Z → axis='Z'. Камера и свет в Blender светят/смотрят
    по −Z → для них axis='-Z' (частая ошибка: камера смотрит «назад», кадр пустой)."""
    return direction.to_track_quat(axis, 'Y').to_euler()


def build():
    clear_scene()
    scene = bpy.context.scene
    coll = scene.collection

    petal_mat = material('Petals', roughness=0.6, sheen=0.08, use_vertex_color=True)
    leaf_mat = material('Leaves', roughness=0.7, use_vertex_color=True)
    stem_mat = material('Stems', STEM_COLOR, roughness=0.8)
    wrap_mat = material('Wrap', WRAP_COLOR, roughness=0.85, sheen=0.05)
    ribbon_mat = material('Ribbon', RIBBON_COLOR, roughness=0.35)

    # Несколько вариантов пиона — головки разные, а файл маленький.
    variants = [peony_mesh(f'PeonyMesh{i}', PEONY_COLORS[i % len(PEONY_COLORS)], petal_mat, coll) for i in range(3)]
    for v in variants:
        v.hide_render = v.hide_viewport = True
        v.hide_set(True)

    heads = []
    binding = Vector((0, 0, 0.35))  # где связаны стебли
    for i, (pos, normal) in enumerate(dome_points(HEADS)):
        src = variants[i % len(variants)]
        obj = bpy.data.objects.new(f'Peony{i}', src.data)  # тот же меш — linked duplicate
        coll.objects.link(obj)
        obj.location = pos
        obj.rotation_euler = look_rotation((normal + Vector((0, 0, 0.6))).normalized())
        obj.rotation_euler.rotate_axis('Z', rnd.uniform(0, math.tau))
        obj.scale = [rnd.uniform(0.85, 1.05)] * 3
        heads.append(obj)

    for v in variants:  # прототипы больше не нужны в сцене (меши остаются у копий)
        bpy.data.objects.remove(v)

    # Стебли: от каждой головки к связке, ниже — пучком вниз.
    bm = bmesh.new()
    for obj in heads:
        top = obj.location - Vector((0, 0, 0.15))
        bottom = Vector((rnd.uniform(-0.08, 0.08), rnd.uniform(-0.08, 0.08), -0.9))
        for a, b in ((top, binding), (binding, bottom)):
            direction = b - a
            mat4 = Matrix.Translation((a + b) / 2) @ direction.to_track_quat('Z', 'Y').to_matrix().to_4x4()
            bmesh.ops.create_cone(bm, cap_ends=False, segments=6, radius1=0.025, radius2=0.025, depth=direction.length, matrix=mat4)
    mesh_object('Stems', bm, stem_mat, coll)

    # Эвкалипт по краю купола.
    euc = eucalyptus_mesh('EucalyptusMesh', leaf_mat, coll)
    euc.hide_set(True)
    for i in range(6):
        az = i / 6 * math.tau + 0.3
        obj = bpy.data.objects.new(f'Eucalyptus{i}', euc.data)
        coll.objects.link(obj)
        obj.location = (math.cos(az) * 0.7, math.sin(az) * 0.7, 1.3)
        obj.rotation_euler = (math.radians(35) * math.sin(az) * -1, math.radians(35) * math.cos(az), az)
        obj.rotation_euler = look_rotation(Vector((math.cos(az), math.sin(az), 1.4)).normalized())
    bpy.data.objects.remove(euc)

    # Плёнка: листы по кругу, каждый — кусок расширяющегося конуса с волнистым краем.
    bm = bmesh.new()
    sheets = 7
    for s in range(sheets):
        start = s / sheets * math.tau + rnd.uniform(-0.2, 0.2)
        span = math.radians(rnd.uniform(95, 130))
        top = rnd.uniform(1.25, 1.55)
        push = 0.04 * (s % 3)
        rows, cols = 10, 14
        verts = []
        for i in range(rows + 1):
            t = i / rows
            z = -0.9 + (top + 0.9) * t
            r = 0.1 + (1.6 + push) * (t ** 1.6)
            row = []
            for j in range(cols + 1):
                a = start + span * j / cols
                wave = 0.06 * math.sin(j * 1.3 + s) * t ** 4
                row.append(bm.verts.new((math.cos(a) * (r + wave), math.sin(a) * (r + wave), z + wave * 0.6)))
            verts.append(row)
        for i in range(rows):
            for j in range(cols):
                bm.faces.new((verts[i][j], verts[i][j + 1], verts[i + 1][j + 1], verts[i + 1][j]))
    wrap = mesh_object('Wrap', bm, wrap_mat, coll)
    wrap.modifiers.new('Thickness', 'SOLIDIFY').thickness = 0.008

    # Бант: лента — плоское сечение, протянутое вдоль кривой (sweep).
    bm = bmesh.new()
    front = Vector((0, -0.42, 0.2))
    for side in (-1, 1):
        loop = [front + Vector((side * (0.38 - 0.38 * math.cos(a)), -0.04 * math.sin(a), 0.2 * math.sin(a))) for a in [k / 24 * math.tau for k in range(25)]]
        sweep(bm, loop, 0.14, 0.015)
        tail = [front + Vector((side * x, -0.05, -x * 2.6)) for x in (0.0, 0.08, 0.16, 0.24)]
        sweep(bm, tail, 0.12, 0.015)
    bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=0.08, matrix=Matrix.Translation(front))
    mesh_object('Ribbon', bm, ribbon_mat, coll)

    # Свет и камера — для превью и для того, кто откроет .blend.
    world = bpy.data.worlds.new('World')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.96, 0.92, 0.88, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.5
    scene.world = world
    for name, loc, energy, size in (('Key', (3, -4, 5), 350, 4), ('Fill', (-4, -2, 3), 120, 5), ('Rim', (0, 4, 4), 250, 3)):
        light = bpy.data.lights.new(name, 'AREA')
        light.energy = energy
        light.size = size
        obj = bpy.data.objects.new(name, light)
        obj.location = loc
        obj.rotation_euler = look_rotation((Vector((0, 0, 1.2)) - Vector(loc)).normalized(), '-Z')
        coll.objects.link(obj)
    cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera'))
    cam.location = (0, -7.0, 4.2)  # чуть сверху — виден купол из головок
    cam.rotation_euler = look_rotation((Vector((0, 0, 1.05)) - cam.location).normalized(), '-Z')
    cam.data.lens = 50
    coll.objects.link(cam)
    scene.camera = cam
    return scene


def apply_modifiers():
    """Модификаторы (толщина плёнки, «трубка» банта) → в настоящую геометрию:
    glTF понимает только готовые меши."""
    for obj in list(bpy.context.scene.objects):
        if obj.type == 'MESH' and obj.modifiers:
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            for mod in list(obj.modifiers):
                bpy.ops.object.modifier_apply(modifier=mod.name)
            obj.select_set(False)


def render_preview(scene):
    scene.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items.keys() else 'BLENDER_EEVEE'
    scene.render.resolution_x = 900
    scene.render.resolution_y = 1100
    scene.render.film_transparent = True
    scene.render.filepath = OUT_PNG
    bpy.ops.render.render(write_still=True)


def export(scene):
    os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in scene.objects:
        obj.select_set(obj.type == 'MESH')
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_lights=False,
        export_cameras=False,
    )


if __name__ == '__main__':
    scene = build()
    apply_modifiers()
    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
    export(scene)
    if '--no-render' not in sys.argv:
        render_preview(scene)
    print('OK', OUT_GLB, os.path.getsize(OUT_GLB) // 1024, 'KB')
