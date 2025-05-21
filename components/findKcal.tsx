'use client'
import { fetchFoodInfo } from '@/lib/foodIngfo';
import { useEffect, useState } from 'react';
import Modal from 'react-modal';


interface FoodItem {
  rnum: string;
  prdlstReportNo: string;
  productGb: string;
  prdlstNm: string;
  rawmtrl: string;
  allergy: string;
  nutrient: string;
  barcode: string;
  prdkind: string;
  prdkindstate: string;
  manufacture: string;
  seller: string;
  capacity: string;
  imgurl1: string;
  imgurl2: string;
}

interface FoodResponse {
  header: {
    resultCode: string;
    resultMessage: string;
  };
  body: {
    numOfRows: string;
    pageNo: string;
    totalCount: string;
    items: {
      item: FoodItem[] | FoodItem;
    };
  };
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

const extractNutrientInfo = (nutrient: string): FoodData | null => {
  try {
    // 칼로리 추출
    const kcalMatch = nutrient.match(/열량\s*(\d+)kcal/i);
    const kcal = kcalMatch ? parseInt(kcalMatch[1]) : 0;

    // 탄수화물 추출
    const carbMatch = nutrient.match(/탄수화물\s*(\d+)g/i);
    const carbohydrate = carbMatch ? parseInt(carbMatch[1]) : 0;

    // 단백질 추출
    const proteinMatch = nutrient.match(/단백질\s*(\d+\.?\d*)g/i);
    const protein = proteinMatch ? parseFloat(proteinMatch[1]) : 0;

    // 지방 추출
    const fatMatch = nutrient.match(/지방\s*(\d+\.?\d*)g/i);
    const fat = fatMatch ? parseFloat(fatMatch[1]) : 0;

    return {
      foodNm: '',
      kcal,
      protein,
      fat,
      carbohydrate
    };
  } catch (error) {
    console.error('영양 정보 파싱 중 오류:', error);
    return null;
  }
};

const FindKcal = ({foodNm, onSelect}: FindKcalProps) => {
    const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchFoodInfo({
                    foodNm,
                    pageNo: '1',
                    numOfRows: '20',
                }) as FoodResponse;
                
                if (data.body?.items?.item) {
                    const items = Array.isArray(data.body.items.item) 
                        ? data.body.items.item 
                        : [data.body.items.item];
                    setFoodItems(items);
                }
            } catch (err: any) {
                setError(err.message);
                console.error('Error fetching food info:', err);
            } finally {
                setLoading(false);
            }
        }
        if (foodNm) {
            fetchData();
        }
    }, [foodNm]);

    const handleSelect = (item: FoodItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
        const nutrientInfo = extractNutrientInfo(item.nutrient);
        if (nutrientInfo) {
            onSelect({
                ...nutrientInfo,
                foodNm: item.prdlstNm
            });
        }
    }

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    }

    if (loading) {
        return <div className="p-4">로딩 중...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">식품 정보</h1>
            {error && (
                <div className="text-red-500 mb-4">
                    {error}
                </div>
            )}
            {foodItems.length === 0 ? (
                <div className="text-gray-500">검색 결과가 없습니다.</div>
            ) : (
                <div className="grid gap-4">
                    {foodItems.map((item, index) => {
                        const nutrientInfo = extractNutrientInfo(item.nutrient);
                        return (
                            <div 
                                key={index} 
                                className="border p-4 rounded-lg cursor-pointer hover:bg-gray-50"
                                onClick={() => handleSelect(item)}
                            >
                                <div className="flex items-center gap-4">
                                    {item.imgurl1 && (
                                        <img 
                                            src={item.imgurl1} 
                                            alt={item.prdlstNm}
                                            className="w-20 h-20 object-cover rounded"
                                        />
                                    )}
                                    <div>
                                        <h3 className="font-semibold">{item.prdlstNm}</h3>
                                        {nutrientInfo && (
                                            <div className="text-sm text-gray-600">
                                                <p>칼로리: {nutrientInfo.kcal}kcal</p>
                                                <p>탄수화물: {nutrientInfo.carbohydrate}g</p>
                                                <p>단백질: {nutrientInfo.protein}g</p>
                                                <p>지방: {nutrientInfo.fat}g</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50"
                contentLabel="식품 상세 정보"
                ariaHideApp={false}
            >
                {selectedItem && (
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold">{selectedItem.prdlstNm}</h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {selectedItem.imgurl1 && (
                                <img
                                    src={selectedItem.imgurl1}
                                    alt={selectedItem.prdlstNm}
                                    className="w-full h-48 object-cover rounded"
                                />
                            )}
                            <div>
                                <h3 className="font-semibold mb-2">영양 정보</h3>
                                {extractNutrientInfo(selectedItem.nutrient) && (
                                    <div className="space-y-2">
                                        <p>칼로리: {extractNutrientInfo(selectedItem.nutrient)?.kcal}kcal</p>
                                        <p>탄수화물: {extractNutrientInfo(selectedItem.nutrient)?.carbohydrate}g</p>
                                        <p>단백질: {extractNutrientInfo(selectedItem.nutrient)?.protein}g</p>
                                        <p>지방: {extractNutrientInfo(selectedItem.nutrient)?.fat}g</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="font-semibold mb-2">원재료</h3>
                            <p className="text-sm">{selectedItem.rawmtrl}</p>
                        </div>
                        {selectedItem.allergy && (
                            <div className="mt-4">
                                <h3 className="font-semibold mb-2">알레르기 정보</h3>
                                <p className="text-sm text-red-600">{selectedItem.allergy}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default FindKcal;