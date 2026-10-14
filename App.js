import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, Modal, SafeAreaView, StatusBar, Vibration, Alert
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. БАЗА ПРОДУКТОВ РФ
const DEFAULT_FOOD_DB = [
  { id: "f1", name: "Куриная грудка (филе СЫРОЕ)", brand: "База РФ", kcal: 113, p: 23.6, f: 1.9, c: 0, fiber: 0, sugar: 0, state: "raw", pieceW: 200, cost: 48 },
  { id: "f2", name: "Куриная грудка (запечённая / отварная)", brand: "База РФ", kcal: 165, p: 31.0, f: 3.6, c: 0, fiber: 0, sugar: 0, state: "cooked", pieceW: 150, cost: 60 },
  { id: "f3", name: "Индейка филе (сырое)", brand: "Пава-Пава", kcal: 104, p: 22.0, f: 1.5, c: 0, fiber: 0, sugar: 0, state: "raw", pieceW: 200, cost: 58 },
  { id: "f5", name: "Творог 5%", brand: "Простоквашино", kcal: 121, p: 16.0, f: 5.0, c: 3.0, fiber: 0, sugar: 0, state: "cooked", pieceW: 180, cost: 42 },
  { id: "f6", name: "Творог 2%", brand: "Савушкин", kcal: 103, p: 18.0, f: 2.0, c: 3.3, fiber: 0, sugar: 0, state: "cooked", pieceW: 180, cost: 40 },
  { id: "f7", name: "Творог мягкий 0.1%", brand: "Савушкин", kcal: 55, p: 10.0, f: 0.1, c: 3.5, fiber: 0, sugar: 0, state: "cooked", pieceW: 125, cost: 36 },
  { id: "f8", name: "Напиток High-Pro", brand: "Exponenta", kcal: 60, p: 12.0, f: 0, c: 2.5, fiber: 0, sugar: 0, state: "cooked", pieceW: 250, cost: 52 },
  { id: "f9", name: "Яйцо куриное С1 (отварное)", brand: "База РФ", kcal: 157, p: 12.7, f: 11.5, c: 0.7, fiber: 0, sugar: 0, state: "cooked", pieceW: 55, cost: 22 },
  { id: "f11", name: "Рис белый (ВАРЁНЫЙ гарнир)", brand: "Гарнир", kcal: 116, p: 2.4, f: 0.3, c: 25.8, fiber: 0.5, sugar: 0, state: "cooked", pieceW: 200, cost: 6 },
  { id: "f13", name: "Гречка (ВАРЁНАЯ с куриной грудкой)", brand: "Готовое блюдо РФ", kcal: 138, p: 16.5, f: 2.4, c: 12.5, fiber: 2.1, sugar: 0, state: "cooked", pieceW: 280, cost: 45 },
  { id: "f17", name: "Сырники творожные запечённые", brand: "Готовое блюдо РФ", kcal: 185, p: 15.5, f: 6.5, c: 16.0, fiber: 0.6, sugar: 4.0, state: "cooked", pieceW: 180, cost: 65 },
  { id: "f19", name: "Протеин сывороточный WPC-80", brand: "Спортпит", kcal: 395, p: 78.0, f: 6.0, c: 6.0, fiber: 0, sugar: 2.0, state: "raw", pieceW: 30, cost: 220 },
  { id: "f20", name: "Батончик протеиновый", brand: "Bombbar", kcal: 272, p: 33.0, f: 11.0, c: 6.0, fiber: 20.0, sugar: 0, state: "cooked", pieceW: 60, cost: 165 },
  { id: "f21", name: "Банан спелый", brand: "Фрукты", kcal: 96, p: 1.5, f: 0.2, c: 21.8, fiber: 2.6, sugar: 0, state: "cooked", pieceW: 120, cost: 15 }
];

const DEFAULT_SETTINGS = {
  sex: 'm', age: 18, weight: 75, height: 178, bf: '',
  actMode: 'separate', neat: 1.35, sitHours: 6, stress: 40,
  gymDays: 4, gymMin: 60, goal: 'lean_bulk',
  shiftTrain: 300, shiftRest: 150, pRatio: 2.0, fRatio: 0.95,
  waterGoal: 2600, fiberGoal: 30,
  meals: ['Завтрак', 'Обед', 'Ужин', 'Перекус'],
  theme: 'dark'
};

export default function App() {
  const [activeTab, setActiveTab] = useState('diary');
  const [activeDate, setActiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [diaryByDate, setDiaryByDate] = useState({});
  const [personalFoods, setPersonalFoods] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [microOpen, setMicroOpen] = useState(false);

  // Модалки
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState('Завтрак');
  const [searchQuery, setSearchQuery] = useState('');
  const [portionW, setPortionW] = useState('100');
  const [selectedFood, setSelectedFood] = useState(DEFAULT_FOOD_DB[0]);
  const [aiInputText, setAiInputText] = useState('');

  // Загрузка из нативной памяти
  useEffect(() => {
    (async () => {
      try {
        const d = await AsyncStorage.getItem('nb_native_diary');
        const s = await AsyncStorage.getItem('nb_native_settings');
        const pf = await AsyncStorage.getItem('nb_native_pfoods');
        if (d) setDiaryByDate(JSON.parse(d));
        if (s) setSettings(JSON.parse(s));
        if (pf) setPersonalFoods(JSON.parse(pf));
      } catch (e) {}
    })();
  }, []);

  const saveAll = async (newDiary, newSettings, newPFoods) => {
    try {
      if (newDiary) await AsyncStorage.setItem('nb_native_diary', JSON.stringify(newDiary));
      if (newSettings) await AsyncStorage.setItem('nb_native_settings', JSON.stringify(newSettings));
      if (newPFoods) await AsyncStorage.setItem('nb_native_pfoods', JSON.stringify(newPFoods));
    } catch (e) {}
  };

  // Глубокий NEAT и КБЖУ
  const computeDailyTargets = (isTrainDay, s = settings) => {
    const w = parseFloat(s.weight) || 75;
    const h = parseFloat(s.height) || 178;
    const age = parseFloat(s.age) || 18;
    const bf = parseFloat(s.bf);

    let bmr = 0;
    if (!isNaN(bf) && bf > 3 && bf < 55) {
      const lbm = w * (1 - bf / 100);
      bmr = Math.round(370 + 21.6 * lbm);
    } else {
      bmr = Math.round(10 * w + 6.25 * h - 5 * age + (s.sex === 'm' ? 5 : -161));
    }

    const neatMult = parseFloat(s.neat) || 1.35;
    const sitHours = parseFloat(s.sitHours) || 6;
    const stressAddon = parseFloat(s.stress) || 0;
    const sitAdjustment = Math.round((6 - sitHours) * 18);
    const gymBurnAvg = s.actMode === 'separate' ? Math.round(((parseFloat(s.gymDays) || 0) * (parseFloat(s.gymMin) || 0) * 6.5) / 7) : 0;

    const tdee = Math.round(bmr * neatMult + gymBurnAvg + sitAdjustment + stressAddon);
    const shift = isTrainDay ? (parseFloat(s.shiftTrain) || 0) : (parseFloat(s.shiftRest) || 0);
    const targetKcal = Math.max(1200, tdee + shift);

    const p = Math.round(w * (parseFloat(s.pRatio) || 2.0));
    const f = Math.round(w * (parseFloat(s.fRatio) || 0.95));
    const c = Math.max(40, Math.round((targetKcal - p * 4 - f * 9) / 4));
    return { bmr, tdee, kcal: targetKcal, p, f, c };
  };

  const curDay = diaryByDate[activeDate] || {
    isTrainDay: true, waterMl: 0, extraFiber: 0, extraSugar: 0, extraCost: 0, items: []
  };

  const targets = computeDailyTargets(curDay.isTrainDay);

  const shiftDate = (delta) => {
    Vibration.vibrate(10);
    const d = new Date(activeDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setActiveDate(d.toISOString().slice(0, 10));
  };

  const toggleTrainDay = () => {
    Vibration.vibrate(12);
    const updated = {
      ...diaryByDate,
      [activeDate]: { ...curDay, isTrainDay: !curDay.isTrainDay }
    };
    setDiaryByDate(updated);
    saveAll(updated, null, null);
  };

  const quickAddMicro = (type, amount) => {
    Vibration.vibrate(15);
    const updatedDay = { ...curDay };
    if (type === 'water') updatedDay.waterMl = (updatedDay.waterMl || 0) + amount;
    if (type === 'fiber') updatedDay.extraFiber = (updatedDay.extraFiber || 0) + amount;
    if (type === 'sugar') updatedDay.extraSugar = (updatedDay.extraSugar || 0) + amount;
    if (type === 'cost') updatedDay.extraCost = (updatedDay.extraCost || 0) + amount;

    const updated = { ...diaryByDate, [activeDate]: updatedDay };
    setDiaryByDate(updated);
    saveAll(updated, null, null);
  };

  const addSelectedFoodToDiary = () => {
    Vibration.vibrate(15);
    const w = parseFloat(portionW) || 100;
    const mult = w / 100;
    const newItem = {
      id: 'id_' + Date.now(),
      meal: selectedMeal,
      name: selectedFood.name,
      brand: selectedFood.brand,
      weight: Math.round(w),
      kcal: Math.round(selectedFood.kcal * mult),
      p: Math.round(selectedFood.p * mult * 10) / 10,
      f: Math.round(selectedFood.f * mult * 10) / 10,
      c: Math.round(selectedFood.c * mult * 10) / 10,
      fiber: Math.round((selectedFood.fiber || 0) * mult * 10) / 10,
      cost: Math.round((selectedFood.cost || 0) * mult)
    };
    const updated = {
      ...diaryByDate,
      [activeDate]: { ...curDay, items: [...curDay.items, newItem] }
    };
    setDiaryByDate(updated);
    saveAll(updated, null, null);
    setAddModalOpen(false);
  };

  const deleteFoodItem = (id) => {
    Vibration.vibrate(12);
    const updated = {
      ...diaryByDate,
      [activeDate]: { ...curDay, items: curDay.items.filter(i => i.id !== id) }
    };
    setDiaryByDate(updated);
    saveAll(updated, null, null);
  };

  const handleAiParseAndAdd = () => {
    const s = aiInputText.replace(/,/g, '.');
    const pM = s.match(/(\d+(?:\.\d+)?)\s*(?:г|гр)?\s*(?:белк[а-я]*|б\b)/i);
    const cM = s.match(/(\d+(?:\.\d+)?)\s*(?:г|гр)?\s*(?:углевод[а-я]*|угл[а-я]*|у\b)/i);
    const fM = s.match(/(\d+(?:\.\d+)?)\s*(?:г|гр)?\s*(?:жир[а-я]*|ж\b)/i);
    const kM = s.match(/(\d{2,4})\s*(?:ккал)/i);

    if (!pM && !cM && !fM) {
      Alert.alert("Подсказка", "Напишите, например: «Белковый ролл 55г белка 40г углеводов 12г жиров»");
      return;
    }
    const p = pM ? parseFloat(pM[1]) : 0;
    const c = cM ? parseFloat(cM[1]) : 0;
    const f = fM ? parseFloat(fM[1]) : 0;
    const kcal = kM ? parseInt(kM[1]) : Math.round(p * 4 + f * 9 + c * 4);

    let name = s
      .replace(/(\d+(?:[.,]\d+)?)\s*(?:г|гр)?\s*(?:белк[а-я]*|б\b|углевод[а-я]*|угл[а-я]*|у\b|жир[а-я]*|ж\b|ккал)/gi, '')
      .replace(/\b(на|с|и|плюс|по)\b/gi, ' ')
      .trim() || "Продукт (ИИ)";

    const newCustomFood = {
      id: 'ai_' + Date.now(),
      name: name.charAt(0).toUpperCase() + name.slice(1),
      brand: 'ИИ-Ассистент',
      weight: 100, kcal, p, f, c, fiber: 0, cost: 0
    };

    const updatedPFoods = [newCustomFood, ...personalFoods];
    setPersonalFoods(updatedPFoods);

    const updatedDiary = {
      ...diaryByDate,
      [activeDate]: {
        ...curDay,
        items: [...curDay.items, { ...newCustomFood, meal: settings.meals[0] }]
      }
    };
    setDiaryByDate(updatedDiary);
    saveAll(updatedDiary, null, updatedPFoods);
    setAiInputText('');
    setAiModalOpen(false);
    Vibration.vibrate(20);
  };

  const sums = curDay.items.reduce((acc, it) => ({
    kcal: acc.kcal + (it.kcal || 0),
    p: acc.p + (it.p || 0),
    f: acc.f + (it.f || 0),
    c: acc.c + (it.c || 0),
    fiber: acc.fiber + (it.fiber || 0),
    cost: acc.cost + (it.cost || 0)
  }), { kcal: 0, p: 0, f: 0, c: 0, fiber: curDay.extraFiber || 0, cost: curDay.extraCost || 0 });

  const eatenKcal = Math.round(sums.kcal);
  const remKcal = targets.kcal - eatenKcal;
  const circumference = 351.8;
  const ringRatio = Math.min(1, Math.max(0, eatenKcal / (targets.kcal || 1)));
  const strokeDashoffset = circumference - ringRatio * circumference;

  const allFoods = [...personalFoods, ...DEFAULT_FOOD_DB];
  const filteredFoods = allFoods.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.datePill}>
          <TouchableOpacity onPress={() => shiftDate(-1)} style={styles.dateArrow}><Text style={styles.arrowTxt}>‹</Text></TouchableOpacity>
          <Text style={styles.dateText}>{activeDate}</Text>
          <TouchableOpacity onPress={() => shiftDate(1)} style={styles.dateArrow}><Text style={styles.arrowTxt}>›</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.statusPill} onPress={toggleTrainDay}>
          <Text style={styles.statusPillTxt}>⚡ {curDay.isTrainDay ? 'Тренировка' : 'Отдых'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {activeTab === 'diary' && (
          <>
            {/* ENERGY CARD */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <View>
                  <Text style={styles.cardTitle}>Баланс энергии</Text>
                  <Text style={styles.cardSub}>Съедено {eatenKcal} из {targets.kcal} ккал</Text>
                </View>
                <View style={styles.chipBadge}><Text style={styles.chipBadgeTxt}>TDEE {targets.tdee}</Text></View>
              </View>

              <View style={styles.heroGrid}>
                {/* SVG RING */}
                <View style={styles.ringBox}>
                  <Svg width={146} height={146} viewBox="0 0 140 140" style={{ transform: [{ rotate: '-90deg' }] }}>
                    <Circle cx="70" cy="70" r="56" stroke="#18181c" strokeWidth="11" fill="none" />
                    <Circle
                      cx="70" cy="70" r="56"
                      stroke={remKcal >= 0 ? "#3b82f6" : "#f43f5e"}
                      strokeWidth="11"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      fill="none"
                    />
                  </Svg>
                  <View style={styles.ringCenter}>
                    <Text style={styles.ringKcalNum}>{remKcal}</Text>
                    <Text style={styles.ringKcalLbl}>{remKcal >= 0 ? 'ОСТАЛОСЬ' : 'ПРОФИЦИТ'}</Text>
                  </View>
                </View>

                {/* MACROS */}
                <View style={styles.macrosCol}>
                  {[
                    { label: 'Белки', eaten: sums.p, target: targets.p, color: '#f43f5e' },
                    { label: 'Жиры', eaten: sums.f, target: targets.f, color: '#f59e0b' },
                    { label: 'Углеводы', eaten: sums.c, target: targets.c, color: '#10b981' }
                  ].map((m, i) => {
                    const pct = Math.min(100, Math.round((m.eaten / (m.target || 1)) * 100));
                    const rem = Math.round(m.target - m.eaten);
                    return (
                      <View key={i} style={{ marginBottom: 10 }}>
                        <View style={styles.macroRowTop}>
                          <Text style={styles.macroLabel}>{m.label}</Text>
                          <Text style={styles.macroLabel}>{Math.round(m.eaten)} / {m.target}г</Text>
                        </View>
                        <View style={styles.macroTrack}>
                          <View style={[styles.macroFill, { width: `${pct}%`, backgroundColor: m.color }]} />
                        </View>
                        <Text style={styles.macroRem}>{rem >= 0 ? `Осталось ${rem}г` : `Перебор ${Math.abs(rem)}г`}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* MICRO DRAWER */}
              <TouchableOpacity style={styles.microToggle} onPress={() => setMicroOpen(!microOpen)}>
                <Text style={styles.microToggleTxt}>💧 {curDay.waterMl || 0} мл • 🌾 Клетч. {sums.fiber.toFixed(1)}г • ₽ {sums.cost}</Text>
                <Text style={{ color: '#8e8e98' }}>{microOpen ? '▴' : '▾'}</Text>
              </TouchableOpacity>

              {microOpen && (
                <View style={styles.microGrid}>
                  <TouchableOpacity style={styles.microCell} onPress={() => quickAddMicro('water', 250)}>
                    <Text style={styles.microCellSub}>💧 Вода</Text>
                    <Text style={styles.microCellVal}>{curDay.waterMl || 0}</Text>
                    <Text style={styles.microPlus}>+250 мл</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.microCell} onPress={() => quickAddMicro('fiber', 2)}>
                    <Text style={styles.microCellSub}>🌾 Клетч.</Text>
                    <Text style={styles.microCellVal}>{sums.fiber.toFixed(1)}г</Text>
                    <Text style={styles.microPlus}>+2 г</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.microCell} onPress={() => quickAddMicro('cost', 50)}>
                    <Text style={styles.microCellSub}>💳 Бюджет</Text>
                    <Text style={styles.microCellVal}>{sums.cost} ₽</Text>
                    <Text style={styles.microPlus}>+50 ₽</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* AI PILLS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <TouchableOpacity style={[styles.actionPill, styles.aiPill]} onPress={() => setAiModalOpen(true)}>
                <Text style={styles.actionPillTxt}>✨ ИИ-Ассистент (По описанию)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionPill} onPress={() => { setSelectedMeal(settings.meals[0]); setAddModalOpen(true); }}>
                <Text style={styles.actionPillTxt}>🔍 База продуктов РФ</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* MEALS */}
            {settings.meals.map((mealName) => {
              const mItems = curDay.items.filter(i => i.meal === mealName);
              const mKcal = Math.round(mItems.reduce((a, b) => a + b.kcal, 0));
              const mP = Math.round(mItems.reduce((a, b) => a + b.p, 0));
              const mF = Math.round(mItems.reduce((a, b) => a + b.f, 0));
              const mC = Math.round(mItems.reduce((a, b) => a + b.c, 0));

              return (
                <View key={mealName} style={styles.mealCard}>
                  <TouchableOpacity style={styles.mealHeader} onPress={() => { setSelectedMeal(mealName); setAddModalOpen(true); }}>
                    <View>
                      <Text style={styles.mealTitle}>{mealName}</Text>
                      <Text style={styles.mealSub}>Б: {mP}г • Ж: {mF}г • У: {mC}г</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={styles.kcalBadge}><Text style={styles.kcalBadgeTxt}>{mKcal} ккал</Text></View>
                      <View style={styles.circleBtn}><Text style={{ color: '#fff', fontWeight: '700' }}>＋</Text></View>
                    </View>
                  </TouchableOpacity>

                  {mItems.length > 0 && (
                    <View style={styles.mealBody}>
                      {mItems.map(it => (
                        <View key={it.id} style={styles.foodRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.foodTitle}>{it.name}</Text>
                            <Text style={styles.foodMeta}>{it.weight}г • Б:{it.p} Ж:{it.f} У:{it.c}</Text>
                          </View>
                          <Text style={styles.foodKcal}>{it.kcal}</Text>
                          <TouchableOpacity onPress={() => deleteFoodItem(it.id)} style={styles.delBtn}>
                            <Text style={{ color: '#8e8e98', fontSize: 12 }}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Персональная норма и Глубокий NEAT</Text>
            <Text style={[styles.cardSub, { marginBottom: 14 }]}>Все изменения мгновенно пересчитывают цель</Text>

            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inpLabel}>Вес (кг)</Text>
                <TextInput
                  style={styles.input} keyboardType="numeric"
                  value={String(settings.weight)}
                  onChangeText={v => { const ns = { ...settings, weight: v }; setSettings(ns); saveAll(null, ns, null); }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inpLabel}>Рост (см)</Text>
                <TextInput
                  style={styles.input} keyboardType="numeric"
                  value={String(settings.height)}
                  onChangeText={v => { const ns = { ...settings, height: v }; setSettings(ns); saveAll(null, ns, null); }}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inpLabel}>Белок (г/кг)</Text>
                <TextInput
                  style={styles.input} keyboardType="numeric"
                  value={String(settings.pRatio)}
                  onChangeText={v => { const ns = { ...settings, pRatio: v }; setSettings(ns); saveAll(null, ns, null); }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inpLabel}>Сдвиг ккал (Трен.)</Text>
                <TextInput
                  style={styles.input} keyboardType="numeric"
                  value={String(settings.shiftTrain)}
                  onChangeText={v => { const ns = { ...settings, shiftTrain: v }; setSettings(ns); saveAll(null, ns, null); }}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* DOCK */}
      <View style={styles.dock}>
        <TouchableOpacity style={[styles.dockBtn, activeTab === 'diary' && styles.dockBtnActive]} onPress={() => setActiveTab('diary')}>
          <Text style={styles.dockTxt}>◎ Сегодня</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => { setSelectedMeal(settings.meals[0]); setAddModalOpen(true); }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>＋</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.dockBtn, activeTab === 'settings' && styles.dockBtnActive]} onPress={() => setActiveTab('settings')}>
          <Text style={styles.dockTxt}>⚙️ Цели</Text>
        </TouchableOpacity>
      </View>

      {/* ADD FOOD MODAL */}
      <Modal visible={addModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Добавить в «{selectedMeal}»</Text>
              <TouchableOpacity onPress={() => setAddModalOpen(false)} style={styles.circleBtn}><Text style={{ color: '#fff' }}>✕</Text></TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { marginBottom: 10 }]}
              placeholder="Поиск продукта (творог, грудка, рис)..."
              placeholderTextColor="#8e8e98"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <ScrollView style={{ maxHeight: 190, marginBottom: 12 }}>
              {filteredFoods.map(item => (
                <TouchableOpacity key={item.id} style={styles.foodRow} onPress={() => setSelectedFood(item)}>
                  <View>
                    <Text style={[styles.foodTitle, selectedFood.id === item.id && { color: '#3b82f6' }]}>{item.name}</Text>
                    <Text style={styles.foodMeta}>{item.kcal} ккал • Б:{item.p} Ж:{item.f} У:{item.c}</Text>
                  </View>
                  <Text style={{ color: '#3b82f6', fontWeight: '700', fontSize: 12 }}>Выбрать</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.selectedBox}>
              <Text style={styles.foodTitle}>{selectedFood.name}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginVertical: 8 }}>
                {[50, 100, 150, 200, 250].map(w => (
                  <TouchableOpacity key={w} style={styles.weightChip} onPress={() => setPortionW(String(w))}>
                    <Text style={{ color: '#fafafa', fontSize: 12, fontWeight: '700' }}>{w}г</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input} keyboardType="numeric"
                value={portionW} onChangeText={setPortionW}
                placeholder="Вес в граммах"
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={addSelectedFoodToDiary}>
                <Text style={styles.primaryBtnTxt}>✓ Записать ({Math.round(selectedFood.kcal * (parseFloat(portionW)||100)/100)} ккал)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* AI ADD MODAL */}
      <Modal visible={aiModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>✨ ИИ-создание продукта</Text>
              <TouchableOpacity onPress={() => setAiModalOpen(false)} style={styles.circleBtn}><Text style={{ color: '#fff' }}>✕</Text></TouchableOpacity>
            </View>
            <Text style={[styles.cardSub, { marginBottom: 10 }]}>
              Напишите название и БЖУ, например: «Белковый ролл 55г белка 40г углеводов 12г жиров»
            </Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              multiline
              placeholder="Введите описание и макросы..."
              placeholderTextColor="#8e8e98"
              value={aiInputText}
              onChangeText={setAiInputText}
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleAiParseAndAdd}>
              <Text style={styles.primaryBtnTxt}>✨ Распознать и добавить в рацион</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b', paddingHorizontal: 14, paddingTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  datePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121215', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  dateArrow: { paddingHorizontal: 10, paddingVertical: 2 },
  arrowTxt: { color: '#8e8e98', fontSize: 18, fontWeight: '700' },
  dateText: { color: '#fafafa', fontWeight: '700', fontSize: 13, marginHorizontal: 6 },
  statusPill: { backgroundColor: '#121215', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statusPillTxt: { color: '#fafafa', fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: '#121215', borderRadius: 30, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { color: '#fafafa', fontSize: 16, fontWeight: '700' },
  cardSub: { color: '#8e8e98', fontSize: 12, marginTop: 2 },
  chipBadge: { backgroundColor: 'rgba(59,130,246,0.14)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99 },
  chipBadgeTxt: { color: '#3b82f6', fontSize: 11, fontWeight: '700' },
  heroGrid: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ringBox: { width: 146, height: 146, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringKcalNum: { color: '#fafafa', fontSize: 22, fontWeight: '800' },
  ringKcalLbl: { color: '#8e8e98', fontSize: 10, fontWeight: '700', marginTop: 2 },
  macrosCol: { flex: 1 },
  macroRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  macroLabel: { color: '#fafafa', fontSize: 12, fontWeight: '700' },
  macroTrack: { height: 7, backgroundColor: '#18181c', borderRadius: 99, overflow: 'hidden' },
  macroFill: { height: '100%', borderRadius: 99 },
  macroRem: { color: '#8e8e98', fontSize: 11, marginTop: 3 },
  microToggle: { backgroundColor: '#18181c', borderRadius: 99, paddingVertical: 10, paddingHorizontal: 16, marginTop: 14, flexDirection: 'row', justifyContent: 'space-between' },
  microToggleTxt: { color: '#fafafa', fontSize: 12, fontWeight: '600' },
  microGrid: { flexDirection: 'row', gap: 8, marginTop: 10 },
  microCell: { flex: 1, backgroundColor: '#18181c', borderRadius: 22, padding: 10, alignItems: 'center' },
  microCellSub: { color: '#8e8e98', fontSize: 11 },
  microCellVal: { color: '#fafafa', fontSize: 14, fontWeight: '700', marginVertical: 3 },
  microPlus: { color: '#3b82f6', fontSize: 11, fontWeight: '700' },
  actionPill: { backgroundColor: '#121215', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  aiPill: { backgroundColor: 'rgba(59,130,246,0.14)', borderColor: 'rgba(59,130,246,0.35)' },
  actionPillTxt: { color: '#fafafa', fontSize: 12, fontWeight: '700' },
  mealCard: { backgroundColor: '#121215', borderRadius: 26, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  mealHeader: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealTitle: { color: '#fafafa', fontSize: 15, fontWeight: '700' },
  mealSub: { color: '#8e8e98', fontSize: 12, marginTop: 2 },
  kcalBadge: { backgroundColor: '#18181c', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99 },
  kcalBadgeTxt: { color: '#fafafa', fontSize: 13, fontWeight: '800' },
  circleBtn: { width: 32, height: 32, borderRadius: 99, backgroundColor: '#18181c', alignItems: 'center', justifyContent: 'center' },
  mealBody: { backgroundColor: '#18181c', paddingHorizontal: 14, paddingVertical: 6 },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  foodTitle: { color: '#fafafa', fontSize: 13, fontWeight: '600' },
  foodMeta: { color: '#8e8e98', fontSize: 11, marginTop: 2 },
  foodKcal: { color: '#fafafa', fontWeight: '700', fontSize: 13, marginRight: 10 },
  delBtn: { padding: 6 },
  dock: { position: 'absolute', bottom: 14, left: 16, right: 16, backgroundColor: 'rgba(18,18,21,0.92)', borderRadius: 99, paddingVertical: 8, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  dockBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 99 },
  dockBtnActive: { backgroundColor: '#18181c' },
  dockTxt: { color: '#fafafa', fontSize: 12, fontWeight: '700' },
  fab: { width: 46, height: 46, borderRadius: 99, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#121215', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 18, maxHeight: '88%' },
  input: { backgroundColor: '#18181c', color: '#fafafa', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontWeight: '600', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  inpLabel: { color: '#8e8e98', fontSize: 11, marginBottom: 4, marginLeft: 4 },
  selectedBox: { backgroundColor: '#09090b', padding: 14, borderRadius: 24 },
  weightChip: { backgroundColor: '#18181c', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 },
  primaryBtn: { backgroundColor: '#3b82f6', borderRadius: 99, paddingVertical: 13, alignItems: 'center', marginTop: 10 },
  primaryBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 }
});
