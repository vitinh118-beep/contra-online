/**
 * Level & Stage Definitions for Contra Arcade Remastered
 * Famous Vietnam & World Landmarks:
 * Stage 1: Rừng Tây Nguyên & Thác Dray Nur (Jungle & Waterfall)
 * Stage 2: Đồi Cát Bay Mũi Né & Sa Mạc Sahara (Desert & Dunes)
 * Stage 3: Kỳ Quan Vịnh Hạ Long & Hawaii Beach (Islands & Coast)
 * Stage 4: Thành Phố Sài Gòn & Tokyo Cyberpunk (Neon City & Skyway)
 * Stage 5: Kỳ Quan Hang Sơn Đoòng & Hang Ổ Trùm Cuối (Cave of Wonders & Core)
 */

import { LevelConfig } from '../types';

export const LEVELS: LevelConfig[] = [
  // --- STAGE 1: RỪNG TÂY NGUYÊN & THÁC DRAY NUR (VIETNAM HIGHLAND JUNGLE) ---
  {
    id: 1,
    name: 'Vòng 1: Rừng Tây Nguyên & Thác Dray Nur',
    subtitle: 'Đại ngàn rừng thiêng, cầu treo buôn làng & dòng sông Sêrêpôk',
    length: 3400,
    groundY: 220,
    bgType: 'jungle',
    platforms: [
      { id: 'p1_ground_0', x: 0, y: 220, width: 450, height: 50, type: 'solid' },
      { id: 'p1_ledge_1', x: 180, y: 165, width: 140, height: 16, type: 'oneway' },
      { id: 'p1_ledge_2', x: 300, y: 120, width: 110, height: 16, type: 'oneway' },

      // Sông Sêrêpôk nước chảy xiết
      { id: 'p1_water_1', x: 450, y: 232, width: 240, height: 38, type: 'water' },

      // Đảo đá giữa sông
      { id: 'p1_ground_1', x: 690, y: 220, width: 260, height: 50, type: 'solid' },
      { id: 'p1_ledge_3', x: 730, y: 160, width: 160, height: 16, type: 'oneway' },

      // Cầu treo buôn Đôn (rút ngắn còn 80% = 192px)
      { id: 'p1_bridge_1', x: 950, y: 220, width: 192, height: 16, type: 'bridge', triggerX: 960 },

      // Căn cứ rừng già (bắt đầu nối từ mép cầu 1142)
      { id: 'p1_ground_2', x: 1142, y: 220, width: 548, height: 50, type: 'solid' },
      { id: 'p1_ledge_4', x: 1250, y: 165, width: 150, height: 16, type: 'oneway' },
      { id: 'p1_ledge_5', x: 1430, y: 130, width: 160, height: 16, type: 'oneway' },
      { id: 'p1_ledge_6', x: 1490, y: 80, width: 120, height: 16, type: 'oneway' },

      // Thác nước Dray Nur nhánh 2
      { id: 'p1_water_2', x: 1690, y: 232, width: 280, height: 38, type: 'water' },
      // Cầu treo thứ hai (rút ngắn còn 80% = 176px)
      { id: 'p1_bridge_2', x: 1970, y: 220, width: 176, height: 16, type: 'bridge', triggerX: 1980 },

      // Tiếp cận sào huyệt (bắt đầu nối từ 2146)
      { id: 'p1_ground_3', x: 2146, y: 220, width: 724, height: 50, type: 'solid' },
      { id: 'p1_ledge_7', x: 2260, y: 165, width: 140, height: 16, type: 'oneway' },
      { id: 'p1_ledge_8', x: 2440, y: 140, width: 160, height: 16, type: 'oneway' },
      { id: 'p1_ledge_9', x: 2620, y: 175, width: 120, height: 16, type: 'oneway' },

      // Pháo đài rừng rậm
      { id: 'p1_boss_ground', x: 2870, y: 220, width: 550, height: 50, type: 'solid' },
      { id: 'p1_boss_ledge_low', x: 2940, y: 165, width: 140, height: 16, type: 'oneway' },
      { id: 'p1_boss_ledge_high', x: 3020, y: 115, width: 160, height: 16, type: 'oneway' },
    ],
    npcSpawns: [
      { type: 'dog', x: 120, y: 205, name: 'Chó Vàng Tây Nguyên' },
      { type: 'monkey', x: 320, y: 105, name: 'Khỉ Vàng Rừng Già' },
      { type: 'fish', x: 550, y: 235, name: 'Cá Lăng Sêrêpôk' },
      { type: 'civilian', x: 800, y: 200, name: 'Người Dân Buôn Làng' },
      { type: 'fish', x: 1780, y: 235, name: 'Cá Suối Tây Nguyên' },
      { type: 'dog', x: 2300, y: 205, name: 'Chó Phú Quốc' },
    ],
    enemySpawns: [
      { triggerX: 120, type: 'soldier', x: 350, y: 200 },
      { triggerX: 200, type: 'soldier', x: 440, y: 200 },
      // LẦN 1: Đạn bay ra lấy súng máy M
      { triggerX: 380, type: 'capsule', x: 370, y: 60, dropItem: 'M' },
      { triggerX: 480, type: 'sniper', x: 580, y: 160 },
      { triggerX: 580, type: 'turret', x: 760, y: 216 },
      { triggerX: 680, type: 'soldier', x: 900, y: 200 },
      { triggerX: 820, type: 'sniper', x: 940, y: 155 },
      { triggerX: 1050, type: 'wall_sensor', x: 1300, y: 155, dropItem: 'L' },
      { triggerX: 1150, type: 'soldier', x: 1380, y: 200 },
      { triggerX: 1200, type: 'turret', x: 1460, y: 216 },
      // LẦN 2: Đạn bay ra lấy súng Laser L
      { triggerX: 1260, type: 'capsule', x: 1250, y: 55, dropItem: 'L' },
      { triggerX: 1350, type: 'soldier', x: 1580, y: 200 },
      { triggerX: 1500, type: 'sniper', x: 1640, y: 75 },
      { triggerX: 1800, type: 'soldier', x: 2070, y: 200 },
      // LẦN 3: Đạn bay ra lấy súng Lan Spread S
      { triggerX: 2050, type: 'capsule', x: 2040, y: 50, dropItem: 'S' },
      { triggerX: 2150, type: 'turret', x: 2300, y: 216 },
      { triggerX: 2280, type: 'soldier', x: 2470, y: 200 },
      { triggerX: 2400, type: 'wall_sensor', x: 2520, y: 130, dropItem: 'S' },
      { triggerX: 2550, type: 'soldier', x: 2740, y: 200 },
    ],
    boss: {
      name: 'Trùm Vòng 1: Pháo Đài Rừng Thiêng (Wall Fortress)',
      triggerX: 2870,
      coreX: 3280,
      coreY: 150,
      coreHp: 60,
      turrets: [
        { x: 3260, y: 190, hp: 30 },
        { x: 3260, y: 100, hp: 25 },
      ],
    },
  },

  // --- STAGE 2: ĐỒI CÁT BAY MŨI NÉ & SA MẠC SAHARA (GOLDEN SAND DUNES) ---
  {
    id: 2,
    name: 'Vòng 2: Đồi Cát Bay Mũi Né & Sa Mạc',
    subtitle: 'Đụn cát vàng rực rỡ, tháp Chăm cổ kính & bão cát nhiệt đới',
    length: 3300,
    groundY: 220,
    bgType: 'desert',
    platforms: [
      { id: 'p2_ground_0', x: 0, y: 220, width: 460, height: 50, type: 'solid' },
      { id: 'p2_ledge_1', x: 160, y: 165, width: 140, height: 16, type: 'oneway' },
      { id: 'p2_ledge_2', x: 320, y: 115, width: 130, height: 16, type: 'oneway' },

      // Ốc đảo cát lún / hồ sen nhỏ giữa sa mạc
      { id: 'p2_water_1', x: 460, y: 232, width: 230, height: 38, type: 'water' },

      { id: 'p2_ground_1', x: 690, y: 220, width: 440, height: 50, type: 'solid' },
      { id: 'p2_ledge_3', x: 760, y: 160, width: 150, height: 16, type: 'oneway' },
      { id: 'p2_ledge_4', x: 920, y: 120, width: 140, height: 16, type: 'oneway' },

      // Cầu đá di tích tháp Chăm (rút ngắn còn 80% = 176px)
      { id: 'p2_bridge_1', x: 1130, y: 220, width: 176, height: 16, type: 'bridge', triggerX: 1140 },

      // Nối từ 1306
      { id: 'p2_ground_2', x: 1306, y: 220, width: 664, height: 50, type: 'solid' },
      { id: 'p2_ledge_5', x: 1450, y: 170, width: 160, height: 16, type: 'oneway' },
      { id: 'p2_ledge_6', x: 1640, y: 125, width: 160, height: 16, type: 'oneway' },
      { id: 'p2_ledge_7', x: 1820, y: 80, width: 150, height: 16, type: 'oneway' },

      // Hẻm vực cát lún
      { id: 'p2_water_2', x: 1970, y: 232, width: 250, height: 38, type: 'water' },

      // Đấu trường Tháp Cổ Sa Mạc
      { id: 'p2_boss_ground', x: 2220, y: 220, width: 920, height: 50, type: 'solid' },
      { id: 'p2_boss_ledge_1', x: 2350, y: 165, width: 150, height: 16, type: 'oneway' },
      { id: 'p2_boss_ledge_2', x: 2540, y: 125, width: 160, height: 16, type: 'oneway' },
    ],
    npcSpawns: [
      { type: 'dog', x: 150, y: 205, name: 'Cún Cưng Sa Mạc' },
      { type: 'civilian', x: 820, y: 200, name: 'Du Khách Mũi Né' },
      { type: 'fish', x: 570, y: 235, name: 'Cá Bảy Màu Ốc Đảo' },
      { type: 'dog', x: 1520, y: 155, name: 'Chó Săn Lạc Đà' },
      { type: 'civilian', x: 1720, y: 200, name: 'Thương Nhân Sa Mạc' },
    ],
    enemySpawns: [
      { triggerX: 100, type: 'soldier', x: 320, y: 200 },
      // LẦN 1: Đạn bay ra lấy súng Lan S
      { triggerX: 350, type: 'capsule', x: 340, y: 55, dropItem: 'S' },
      { triggerX: 420, type: 'sniper', x: 420, y: 100 },
      { triggerX: 520, type: 'turret', x: 720, y: 216 },
      { triggerX: 680, type: 'soldier', x: 860, y: 200 },
      { triggerX: 850, type: 'wall_sensor', x: 940, y: 110, dropItem: 'M' },
      { triggerX: 980, type: 'sniper', x: 1140, y: 80 },
      // LẦN 2: Đạn bay ra lấy súng Laser L
      { triggerX: 1120, type: 'capsule', x: 1110, y: 50, dropItem: 'L' },
      { triggerX: 1350, type: 'turret', x: 1600, y: 216 },
      { triggerX: 1550, type: 'soldier', x: 1780, y: 200 },
      // LẦN 3: Đạn bay ra lấy súng Lửa F
      { triggerX: 1820, type: 'capsule', x: 1810, y: 45, dropItem: 'F' },
      { triggerX: 2000, type: 'turret', x: 2180, y: 216 },
    ],
    boss: {
      name: 'Trùm Vòng 2: Cỗ Máy Thần Cát (Desert Sphinx Mech)',
      triggerX: 2450,
      coreX: 2850,
      coreY: 140,
      coreHp: 65,
      turrets: [
        { x: 2830, y: 190, hp: 35 },
        { x: 2830, y: 90, hp: 30 },
      ],
    },
  },

  // --- STAGE 3: KỲ QUAN VỊNH HẠ LONG & BIỂN ĐẢO (EMERALD BAY & ISLANDS) ---
  {
    id: 3,
    name: 'Vòng 3: Kỳ Quan Vịnh Hạ Long & Bờ Biển',
    subtitle: 'Biển xanh ngọc bích, đảo đá vôi kỳ vĩ & thuyền chài truyền thống',
    length: 3500,
    groundY: 220,
    bgType: 'halong_beach',
    platforms: [
      { id: 'p3_ground_0', x: 0, y: 220, width: 380, height: 50, type: 'solid' },
      { id: 'p3_ledge_1', x: 140, y: 160, width: 130, height: 16, type: 'oneway' },

      // Vùng vịnh nước biển ngọc bích 1
      { id: 'p3_water_1', x: 380, y: 232, width: 320, height: 38, type: 'water' },

      // Đảo đá vôi Ti Tốp 1
      { id: 'p3_ground_1', x: 700, y: 220, width: 280, height: 50, type: 'solid' },
      { id: 'p3_ledge_2', x: 750, y: 165, width: 150, height: 16, type: 'oneway' },
      { id: 'p3_ledge_3', x: 820, y: 115, width: 120, height: 16, type: 'oneway' },

      // Cầu phao làng chài Vạn Giã (rút ngắn còn 80% = 192px)
      { id: 'p3_bridge_1', x: 980, y: 220, width: 192, height: 16, type: 'bridge', triggerX: 990 },

      // Vùng vịnh nước biển ngọc bích 2 (nối từ 1172)
      { id: 'p3_water_2', x: 1172, y: 232, width: 388, height: 38, type: 'water' },

      // Đảo đá Hòn Trống Mái
      { id: 'p3_ground_2', x: 1560, y: 220, width: 480, height: 50, type: 'solid' },
      { id: 'p3_ledge_4', x: 1640, y: 165, width: 150, height: 16, type: 'oneway' },
      { id: 'p3_ledge_5', x: 1820, y: 120, width: 160, height: 16, type: 'oneway' },

      // Cầu phao quân sự (rút ngắn còn 80% = 176px)
      { id: 'p3_bridge_2', x: 2040, y: 220, width: 176, height: 16, type: 'bridge', triggerX: 2050 },

      // Đấu trường Pháo đài biển đảo (nối từ 2216)
      { id: 'p3_boss_ground', x: 2216, y: 220, width: 924, height: 50, type: 'solid' },
      { id: 'p3_boss_ledge_1', x: 2380, y: 165, width: 150, height: 16, type: 'oneway' },
      { id: 'p3_boss_ledge_2', x: 2560, y: 120, width: 160, height: 16, type: 'oneway' },
    ],
    npcSpawns: [
      { type: 'fish', x: 450, y: 235, name: 'Cá Song Hạ Long' },
      { type: 'fish', x: 580, y: 235, name: 'Cá Vược Biển Đông' },
      { type: 'civilian', x: 770, y: 200, name: 'Ngư Dân Làng Chài' },
      { type: 'dog', x: 880, y: 205, name: 'Cún Cưng Đảo Biển' },
      { type: 'fish', x: 1340, y: 235, name: 'Cá Chuồn Nhảy Sóng' },
      { type: 'fish', x: 1450, y: 235, name: 'Cá Thu Hoàng Đế' },
      { type: 'civilian', x: 1680, y: 200, name: 'Thuyền Trưởng Du Thuyền' },
    ],
    enemySpawns: [
      { triggerX: 100, type: 'soldier', x: 300, y: 200 },
      // LẦN 1: Đạn bay ra lấy súng Máy M
      { triggerX: 360, type: 'capsule', x: 350, y: 55, dropItem: 'M' },
      { triggerX: 460, type: 'sniper', x: 460, y: 140 },
      { triggerX: 580, type: 'turret', x: 740, y: 216 },
      { triggerX: 750, type: 'soldier', x: 890, y: 200 },
      // LẦN 2: Đạn bay ra lấy súng Lan S
      { triggerX: 1180, type: 'capsule', x: 1170, y: 50, dropItem: 'S' },
      { triggerX: 1280, type: 'turret', x: 1250, y: 216 },
      { triggerX: 1420, type: 'soldier', x: 1420, y: 200 },
      { triggerX: 1600, type: 'sniper', x: 1620, y: 80 },
      // LẦN 3: Đạn bay ra lấy Khiên Bất Tử B
      { triggerX: 1950, type: 'capsule', x: 1940, y: 50, dropItem: 'B' },
      { triggerX: 2100, type: 'turret', x: 2150, y: 216 },
    ],
    boss: {
      name: 'Trùm Vòng 3: Thiết Giáp Hạm Biển Đông (Naval Leviathan)',
      triggerX: 2500,
      coreX: 2900,
      coreY: 135,
      coreHp: 70,
      turrets: [
        { x: 2880, y: 185, hp: 40 },
        { x: 2880, y: 85, hp: 35 },
      ],
    },
  },

  // --- STAGE 4: THÀNH PHỐ SÀI GÒN & TOKYO CYBERPUNK (NEON SKYLINE) ---
  {
    id: 4,
    name: 'Vòng 4: Thành Phố Sài Gòn & Tokyo Cyberpunk',
    subtitle: 'Đèn neon Landmark 81, cầu Ba Son & đường cao tốc trên cao',
    length: 3400,
    groundY: 220,
    bgType: 'cyber_saigon',
    platforms: [
      { id: 'p4_ground_0', x: 0, y: 220, width: 480, height: 50, type: 'solid' },
      { id: 'p4_ledge_1', x: 180, y: 165, width: 150, height: 16, type: 'oneway' },
      { id: 'p4_ledge_2', x: 340, y: 115, width: 140, height: 16, type: 'oneway' },

      // Kênh Nhiêu Lộc / sông Sài Gòn
      { id: 'p4_water_1', x: 480, y: 232, width: 240, height: 38, type: 'water' },

      // Bờ sông Bến Bạch Đằng
      { id: 'p4_ground_1', x: 720, y: 220, width: 440, height: 50, type: 'solid' },
      { id: 'p4_ledge_3', x: 800, y: 160, width: 150, height: 16, type: 'oneway' },
      { id: 'p4_ledge_4', x: 960, y: 110, width: 140, height: 16, type: 'oneway' },

      // Cầu Ba Son dây văng hiện đại (rút ngắn còn 80% = 192px)
      { id: 'p4_bridge_1', x: 1160, y: 220, width: 192, height: 16, type: 'bridge', triggerX: 1170 },

      // Tuyến Metro cao tốc (nối từ 1352)
      { id: 'p4_ground_2', x: 1352, y: 220, width: 688, height: 50, type: 'solid' },
      { id: 'p4_ledge_5', x: 1500, y: 165, width: 160, height: 16, type: 'oneway' },
      { id: 'p4_ledge_6', x: 1680, y: 120, width: 160, height: 16, type: 'oneway' },
      { id: 'p4_ledge_7', x: 1860, y: 75, width: 140, height: 16, type: 'oneway' },

      // Phố đi bộ Nguyễn Huệ
      { id: 'p4_water_2', x: 2040, y: 232, width: 220, height: 38, type: 'water' },

      // Tầng thượng Landmark Cyber Fortress
      { id: 'p4_boss_ground', x: 2260, y: 220, width: 900, height: 50, type: 'solid' },
      { id: 'p4_boss_ledge_1', x: 2380, y: 165, width: 150, height: 16, type: 'oneway' },
      { id: 'p4_boss_ledge_2', x: 2560, y: 120, width: 160, height: 16, type: 'oneway' },
    ],
    npcSpawns: [
      { type: 'dog', x: 140, y: 205, name: 'Corgi Phố Thị' },
      { type: 'civilian', x: 300, y: 200, name: 'Cô Ba Sài Gòn' },
      { type: 'fish', x: 560, y: 235, name: 'Cá Koi Đô Thị' },
      { type: 'civilian', x: 840, y: 200, name: 'Lập Trình Viên AI' },
      { type: 'dog', x: 1550, y: 205, name: 'Husky Tinh Nghịch' },
      { type: 'civilian', x: 1750, y: 200, name: 'Dân Công Sở Đi Bão' },
    ],
    enemySpawns: [
      { triggerX: 120, type: 'soldier', x: 320, y: 200 },
      // LẦN 1: Đạn bay ra lấy súng Lửa F
      { triggerX: 350, type: 'capsule', x: 340, y: 55, dropItem: 'F' },
      { triggerX: 450, type: 'sniper', x: 460, y: 150 },
      { triggerX: 600, type: 'turret', x: 760, y: 216 },
      { triggerX: 780, type: 'soldier', x: 880, y: 200 },
      // LẦN 2: Đạn bay ra lấy súng Laser L
      { triggerX: 1150, type: 'capsule', x: 1140, y: 50, dropItem: 'L' },
      { triggerX: 1250, type: 'turret', x: 1200, y: 216 },
      { triggerX: 1400, type: 'soldier', x: 1360, y: 200 },
      { triggerX: 1650, type: 'sniper', x: 1820, y: 70 },
      // LẦN 3: Đạn bay ra lấy súng Lan S
      { triggerX: 1900, type: 'capsule', x: 1890, y: 45, dropItem: 'S' },
      { triggerX: 2050, type: 'turret', x: 2150, y: 216 },
    ],
    boss: {
      name: 'Trùm Vòng 4: Robot Siêu Trí Tuệ (Cyber Titan Mech)',
      triggerX: 2500,
      coreX: 2920,
      coreY: 135,
      coreHp: 80,
      turrets: [
        { x: 2900, y: 185, hp: 45 },
        { x: 2900, y: 85, hp: 40 },
      ],
    },
  },

  // --- STAGE 5: KỲ QUAN HANG SƠN ĐOÒNG & HANG Ổ QUÁI VẬT (WORLD'S LARGEST CAVE) ---
  {
    id: 5,
    name: 'Vòng 5: Kỳ Quan Hang Sơn Đoòng & Trùm Cuối',
    subtitle: 'Măng đá thạch nhũ triệu năm, giếng trời ánh sáng & Trái Tim Quái Vật',
    length: 3300,
    groundY: 220,
    bgType: 'sondoong_cave',
    platforms: [
      { id: 'p5_ground_0', x: 0, y: 220, width: 480, height: 50, type: 'solid' },
      { id: 'p5_ledge_1', x: 180, y: 165, width: 140, height: 16, type: 'oneway' },
      { id: 'p5_ledge_2', x: 340, y: 115, width: 140, height: 16, type: 'oneway' },

      // Hồ nước ngầm Sơn Đoòng trong vắt
      { id: 'p5_water_1', x: 480, y: 232, width: 260, height: 38, type: 'water' },

      // Bãi thạch nhũ Vọng Phu
      { id: 'p5_ground_1', x: 740, y: 220, width: 480, height: 50, type: 'solid' },
      { id: 'p5_ledge_3', x: 820, y: 160, width: 160, height: 16, type: 'oneway' },
      { id: 'p5_ledge_4', x: 980, y: 110, width: 150, height: 16, type: 'oneway' },

      // Cầu đá tự nhiên bắc qua hố sụt giếng trời (rút ngắn còn 80% = 176px)
      { id: 'p5_bridge_1', x: 1220, y: 220, width: 176, height: 16, type: 'bridge', triggerX: 1230 },

      // Rừng nguyên sinh bên trong lòng hang (Vườn Edam - nối từ 1396)
      { id: 'p5_ground_2', x: 1396, y: 220, width: 684, height: 50, type: 'solid' },
      { id: 'p5_ledge_5', x: 1540, y: 165, width: 150, height: 16, type: 'oneway' },
      { id: 'p5_ledge_6', x: 1720, y: 120, width: 160, height: 16, type: 'oneway' },
      { id: 'p5_ledge_7', x: 1900, y: 75, width: 140, height: 16, type: 'oneway' },

      // Sông ngầm dẫn vào Trái Tim Quái Vật
      { id: 'p5_water_2', x: 2080, y: 232, width: 240, height: 38, type: 'water' },

      // Đấu trường Trùm Cuối Hang Sơn Đoòng
      { id: 'p5_boss_ground', x: 2320, y: 220, width: 950, height: 50, type: 'solid' },
      { id: 'p5_boss_ledge_1', x: 2450, y: 165, width: 150, height: 16, type: 'oneway' },
      { id: 'p5_boss_ledge_2', x: 2640, y: 120, width: 160, height: 16, type: 'oneway' },
    ],
    npcSpawns: [
      { type: 'monkey', x: 150, y: 150, name: 'Khỉ Voọc Sơn Đoòng' },
      { type: 'fish', x: 560, y: 235, name: 'Cá Mù Hang Động' },
      { type: 'civilian', x: 860, y: 200, name: 'Nhà Thám Hiểm Hang Động' },
      { type: 'dog', x: 1600, y: 205, name: 'Chó Cứu Hộ Thám Hiểm' },
      { type: 'civilian', x: 1800, y: 200, name: 'Chuyên Gia Địa Chất' },
    ],
    enemySpawns: [
      { triggerX: 120, type: 'soldier', x: 320, y: 200 },
      // LẦN 1: Đạn bay ra lấy súng Lan Spread S
      { triggerX: 360, type: 'capsule', x: 350, y: 55, dropItem: 'S' },
      { triggerX: 460, type: 'sniper', x: 460, y: 150 },
      { triggerX: 620, type: 'turret', x: 760, y: 216 },
      { triggerX: 800, type: 'soldier', x: 880, y: 200 },
      // LẦN 2: Đạn bay ra lấy súng Laser L
      { triggerX: 1150, type: 'capsule', x: 1140, y: 50, dropItem: 'L' },
      { triggerX: 1280, type: 'turret', x: 1260, y: 216 },
      { triggerX: 1450, type: 'soldier', x: 1400, y: 200 },
      { triggerX: 1650, type: 'sniper', x: 1850, y: 70 },
      // LẦN 3: Đạn bay ra lấy súng Lan S tối thượng trước Trùm Cuối!
      { triggerX: 1900, type: 'capsule', x: 1890, y: 45, dropItem: 'S' },
      { triggerX: 2050, type: 'turret', x: 2200, y: 216 },
    ],
    boss: {
      name: 'Trùm Cuối: Trái Tim Quái Vật Ngoài Hành Tinh (Alien Core Heart)',
      triggerX: 2500,
      coreX: 2950,
      coreY: 130,
      coreHp: 100, // 100 HP cho Trùm Cuối cực kỳ kịch tính
      turrets: [
        { x: 2930, y: 185, hp: 55 },
        { x: 2930, y: 75, hp: 50 },
      ],
    },
  },
];
