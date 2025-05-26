'use client';
import { useEffect, useState } from 'react';
import Modal from 'react-modal';

interface FatsecretFood {
  food_id: string;
  food_name: string;
  food_type: string;
  food_url: string;
  brand_name?: string;
}

interface FatsecretFoodNutrient {
  serving_id: string;
  serving_description: string;
  metric_serving_amount: string;
  metric_serving_unit: string;
  number_of_units: string;
  measurement_description: string;
  calories: string;
  carbohydrate: string;
  protein: string;
  fat: string;
}

interface FoodData {
  foodNm: string;
  kcal: number;
  protein: number;
  fat: number;
  carbohydrate: number;
}

interface FindKcalProps {
  foodNm: string;
  onSelect: (food: FoodData) => void;
}

const FindKcal = ({ foodNm, onSelect }: FindKcalProps) => {
  const [foodList, setFoodList] = useState<FatsecretFood[]>([]);
  const [nutrients, setNutrients] = useState<FatsecretFoodNutrient[]>([]);
  const [selectedServing, setSelectedServing] = useState<FatsecretFoodNutrient | null>(null);
  const [foodListLoading, setFoodListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<FatsecretFood | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!foodNm.trim()) return;
      setFoodListLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/getKcal?foodNm=${encodeURIComponent(foodNm)}`);
        if (!res.ok) throw new Error('음식 정보를 불러오지 못했습니다.');
        const data = await res.json();
        const foods = data.foods?.food || [];
        setFoodList(Array.isArray(foods) ? foods : [foods]);
      } catch (err: any) {
        setError(`음식 검색 중 오류: ${err.message}`);
      } finally {
        setFoodListLoading(false);
      }
    }
    fetchData();
  }, [foodNm]);

  const handleSelect = async (food: FatsecretFood) => {
    setSelectedFood(food);
    setIsModalOpen(true);
    setDetailLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/getFatsecretFoodDetail?food_id=${food.food_id}`);
      const detail = await res.json();
      const servings = detail.food?.servings?.serving || [];
      const servingArr = Array.isArray(servings) ? servings : [servings];
      setNutrients(servingArr);
      setSelectedServing(servingArr[0] || null);
    } catch (err: any) {
      setError(`상세 정보 조회 중 오류: ${err.message}`);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedFood && selectedServing) {
      onSelect({
        foodNm: selectedFood.food_name,
        kcal: Number(selectedServing.calories),
        protein: Number(selectedServing.protein),
        fat: Number(selectedServing.fat),
        carbohydrate: Number(selectedServing.carbohydrate),
      });
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFood(null);
    setNutrients([]);
    setSelectedServing(null);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">식품 정보</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {foodListLoading ? (
        <div>음식 목록 로딩 중...</div>
      ) : foodList.length === 0 ? (
        <div className="text-gray-500">검색 결과가 없습니다.</div>
      ) : (
        <div className="grid gap-4">
          {foodList.map((item, idx) => (
            <div
              key={idx}
              className="border p-4 rounded-lg cursor-pointer hover:bg-gray-50"
              onClick={() => handleSelect(item)}
            >
              <div>
                <h3 className="font-semibold">{item.food_name}</h3>
                {item.brand_name && <div className="text-xs text-gray-500">{item.brand_name}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
        contentLabel="식품 상세 정보"
        ariaHideApp={false}
      >
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">{selectedFood?.food_name}</h2>
            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>

          {detailLoading ? (
            <div>상세 정보 로딩 중...</div>
          ) : selectedServing && nutrients.length > 0 ? (
            <>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">서빙 선택</h3>
                <select
                  className="border p-2 rounded w-full"
                  value={selectedServing.serving_id}
                  onChange={(e) => {
                    const serving = nutrients.find(s => s.serving_id === e.target.value);
                    if (serving) setSelectedServing(serving);
                  }}
                >
                  {nutrients.map((s, i) => (
                    <option key={i} value={s.serving_id}>
                      {s.serving_description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <p>칼로리: {selectedServing.calories} kcal</p>
                <p>탄수화물: {selectedServing.carbohydrate} g</p>
                <p>단백질: {selectedServing.protein} g</p>
                <p>지방: {selectedServing.fat} g</p>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                {selectedServing.serving_description}
              </div>

              <button
                onClick={handleConfirm}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                선택 완료
              </button>
            </>
          ) : (
            <div>서빙 정보가 없습니다.</div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default FindKcal;
