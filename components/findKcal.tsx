'use client';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CertFoodItem {
  prdlstNm: string;
  imgurl1?: string;
  nutrient?: string;
  rawmtrl?: string;
  allergy?: string;
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
  const [foodList, setFoodList] = useState<CertFoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<CertFoodItem | null>(null);
  const [foodListLoading, setFoodListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        const items = data.body?.items?.item || [];
        setFoodList(Array.isArray(items) ? items : [items]);
      } catch (err: any) {
        setError(`음식 검색 중 오류: ${err.message}`);
      } finally {
        setFoodListLoading(false);
      }
    }
    fetchData();
  }, [foodNm]);

  const handleSelect = (item: CertFoodItem) => {
    setSelectedFood(item);
    setIsModalOpen(true);
    if (item.nutrient) {
      const kcalMatch = item.nutrient.match(/열량\s*(\d+)kcal/i);
      const carbMatch = item.nutrient.match(/탄수화물\s*(\d+)g/i);
      const proteinMatch = item.nutrient.match(/단백질\s*(\d+)g/i);
      const fatMatch = item.nutrient.match(/지방\s*(\d+)g/i);
      onSelect({
        foodNm: item.prdlstNm,
        kcal: kcalMatch ? Number(kcalMatch[1]) : 0,
        protein: proteinMatch ? Number(proteinMatch[1]) : 0,
        fat: fatMatch ? Number(fatMatch[1]) : 0,
        carbohydrate: carbMatch ? Number(carbMatch[1]) : 0,
      });
    }
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
          {foodList.map((item: CertFoodItem, idx) => (
            <div
              key={idx}
              className="border p-4 rounded-lg cursor-pointer hover:bg-gray-50"
              onClick={() => handleSelect(item)}
            >
              <div>
                <h3 className="font-semibold">{item.prdlstNm}</h3>
                {item.nutrient && (
                  <div className="text-xs text-gray-500">{item.nutrient}</div>
                )}
                {item.imgurl1 && (
                  <img src={item.imgurl1} alt={item.prdlstNm} className="w-20 h-20 object-cover rounded mt-2" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>{selectedFood?.prdlstNm}</DialogTitle>
          </DialogHeader>
          {selectedFood && (
            <div className="flex flex-col md:flex-row gap-4 items-start">
              {selectedFood.imgurl1 && (
                <img
                  src={selectedFood.imgurl1}
                  alt={selectedFood.prdlstNm}
                  className="w-full md:w-40 h-20 object-cover rounded mb-2 md:mb-0 flex-shrink-0 border"
                  style={{ maxWidth: 160 }}
                />
              )}
              <div className="flex-1 space-y-2">
                <div className="mb-1 border-b pb-1">
                  <strong>영양 정보:</strong>
                  <div className="text-sm text-gray-700 mt-1">{selectedFood.nutrient || '정보 없음'}</div>
                </div>
                <div className="mb-1 border-b pb-1">
                  <strong>원재료:</strong>
                  <div className="text-sm text-gray-700 mt-1">{selectedFood.rawmtrl || '정보 없음'}</div>
                </div>
                <div className="mb-1">
                  <strong>알레르기:</strong>
                  <div className="text-sm text-gray-700 mt-1">{selectedFood.allergy || '정보 없음'}</div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FindKcal;
