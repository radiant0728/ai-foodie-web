/* eslint-disable no-undef */ 
import React, { useState, useEffect, useCallback, useRef } from 'react';

// Firebase Imports: 모두 제거되었습니다.

// --- Global Variables (사용하지 않으므로 더미 값으로 초기화) ---
const appId = 'default-app-id';
const firebaseConfig = null;
const initialAuthToken = null;
// --- End Global Variables ---


// Define App Pages (핵심 기능 페이지)
const PAGES = {
  HOME: 'home',       // 메인 대시보드
  SCAN: 'scan',       // 메인 기능 (Camera, Loading, Result 포함)
  ALLERGIES: 'allergies', // 알레르기 설정 탭
  INFO: 'info',       // 회사 정보, FAQ
  // 서브 페이지: 스캔 흐름
  LOADING: 'loading',
  RESULT: 'result',
};

// Common Allergens List
const ALLERGEN_OPTIONS = [
  '우유 (Milk)', '땅콩 (Peanuts)', '밀 (Wheat)', '계란 (Egg)',
  '대두 (Soy)', '견과류 (Tree Nuts)', '새우 (Shrimp)', '게 (Crab)',
  '복숭아 (Peach)', '토마토 (Tomato)'
];

/* =========================================================================
 * SUB-COMPONENTS (Feature & Display)
 * ========================================================================= */

const ResultDisplay = ({ result, onRestart }) => {
  const { status, message, detail } = result;

  const colorMap = {
    SAFE: { bg: 'bg-green-600', text: 'text-gray-100', accent: 'text-green-300', border: 'border-green-600', icon: '✅' },
    CAUTION: { bg: 'bg-yellow-600', text: 'text-gray-900', accent: 'text-yellow-300', border: 'border-yellow-600', icon: '⚠️' },
    DANGER: { bg: 'bg-red-600', text: 'text-gray-100', accent: 'text-red-300', border: 'border-red-600', icon: '❌' },
  };

  const { bg, text, border, icon } = colorMap[status] || colorMap.SAFE;

  return (
    <div className={`flex flex-col items-center justify-center p-8 space-y-6 rounded-xl ${bg} shadow-2xl mx-auto w-full max-w-md`}>
      <div className={`p-6 rounded-full bg-black/30 border-4 ${border} shadow-xl transform transition duration-500 hover:scale-105`}>
        <div className="text-6xl">{icon}</div>
      </div>
      <h1 className={`text-3xl font-extrabold ${text} text-center font-sans-kr`}>
        {status === 'SAFE' && '안전 (Safe)'}
        {status === 'CAUTION' && '주의 (Caution)'}
        {status === 'DANGER' && '위험 (Danger)'}
      </h1>
      <p className={`text-xl text-gray-200 text-center max-w-sm font-sans-kr`}>{message}</p>

      {status !== 'SAFE' && detail && (
        <div className="w-full max-w-md p-4 bg-gray-800 rounded-lg shadow-inner border border-gray-700">
          <h2 className="text-lg font-semibold mb-2 text-white font-sans-kr">검출된 알레르기 성분:</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-300 font-sans-kr">
            {detail.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-red-300 font-bold mr-2">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onRestart}
        className="mt-8 w-full max-w-sm py-3 px-4 bg-violet-600 text-white font-bold rounded-xl shadow-lg hover:bg-violet-700 transition duration-150 transform hover:scale-[1.02] font-sans-kr"
      >
        새로운 성분표 촬영
      </button>
    </div>
  );
};

const CameraInput = ({ onScan }) => {
  const fileInputRef = useRef(null); 

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onScan(file);
    }
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) { 
      fileInputRef.current.click();
    } else {
      console.error("File input element is not ready.");
    }
  };


  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-8 h-full bg-gray-900 text-white">
      <h1 className="text-3xl font-bold text-violet-400 font-sans-kr">📸 AI 성분 스캔</h1>
      <p className="text-gray-400 text-center max-w-xs font-sans-kr">식품 성분표를 촬영하거나 파일을 업로드하여 즉시 분석합니다.</p>

      <div
        onClick={triggerFileInput} 
        className="w-full max-w-xs cursor-pointer flex flex-col items-center justify-center p-12 border-4 border-dashed border-violet-700 rounded-2xl bg-gray-800 hover:bg-gray-700 transition duration-150 shadow-2xl"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-violet-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.867-1.299A2 2 0 0111.07 4h1.861c.42 0 .813.195 1.07.51L15.405 6.11a2 2 0 001.664.89h.93a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-xl font-semibold text-white font-sans-kr">성분표 업로드</span>
        
        <input
          ref={fileInputRef} 
          id="camera-input"
          type="file"
          accept="image/*"
          capture="environment" 
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <button
        onClick={() => onScan({ name: 'placeholder.jpg', size: 100 })}
        className="mt-4 text-sm text-gray-500 hover:text-gray-400 transition duration-150 font-sans-kr"
      >
        (테스트용: 즉시 결과 시뮬레이션)
      </button>
    </div>
  );
};

const AllergySelector = ({ selectedAllergies, onSelectionChange, onContinue }) => {
  const isSelected = (allergen) => selectedAllergies.includes(allergen);

  const handleToggle = (allergen) => {
    let newSelection;
    if (isSelected(allergen)) {
      newSelection = selectedAllergies.filter(a => a !== allergen);
    } else {
      newSelection = [...selectedAllergies, allergen];
    }
    onSelectionChange(newSelection);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-900 text-white min-h-[calc(100vh-100px)]">
      <h1 className="text-3xl font-bold text-violet-400 font-sans-kr">나의 알레르기 설정</h1>
      <p className="text-gray-400 font-sans-kr">가지고 계신 알레르기 항목을 모두 선택해 주세요. 이 정보는 분석에 사용됩니다.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-3 border border-gray-700 rounded-lg bg-gray-800">
        {ALLERGEN_OPTIONS.map((allergen) => (
          <div
            key={allergen}
            className={`p-3 text-sm font-medium rounded-lg cursor-pointer transition duration-150 shadow-md font-sans-kr
              ${isSelected(allergen)
                ? 'bg-red-600 text-white ring-2 ring-red-400'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
            onClick={() => handleToggle(allergen)}
          >
            {allergen}
          </div>
        ))}
      </div>

      <button
        onClick={onContinue} // 👈 이 버튼이 handleAllergySaveAndContinue를 호출하고 SCAN으로 넘어갑니다.
        className="w-full py-3 px-4 text-white font-bold rounded-xl transition duration-150 bg-violet-600 hover:bg-violet-700 shadow-lg transform hover:scale-[1.01] font-sans-kr"
      >
        설정 완료 및 AI 스캔 시작
      </button>
      <p className="text-xs text-gray-500 text-center font-sans-kr">알레르기 정보는 안전 진단을 위해 사용됩니다.</p>
    </div>
  );
};

const HomeView = ({ onNavigate }) => (
    <div className="p-8 space-y-12 bg-gray-900 text-white min-h-[calc(100vh-100px)]">
        
        {/* 1. Hero Section */}
        <div className="bg-black p-10 rounded-xl shadow-2xl border border-violet-900 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-cover" style={{backgroundImage: 'linear-gradient(135deg, rgba(120, 0, 255, 0.4), rgba(255, 0, 150, 0.4))', zIndex: 0}}></div>
            <div className="relative z-10">
                <h1 className="text-5xl font-extrabold text-white mb-3 font-sans-kr leading-tight">
                    당신의 식생활을 위한 <span className="text-violet-400">AI-Foodie</span>
                </h1>
                <p className="text-xl text-gray-300 mb-6 font-sans-kr">
                    성분표 분석의 첫걸음, <br/> 지금 바로 당신의 안전을 확보하세요.
                </p>
                <button 
                    onClick={() => onNavigate(PAGES.ALLERGIES)} // HOME 버튼 클릭 시 ALLERGIES 페이지로 이동하도록 설정 
                    className="py-3 px-8 bg-violet-600 text-white font-bold rounded-full shadow-lg shadow-violet-500/50 hover:bg-violet-700 transition font-sans-kr transform hover:scale-105"
                >
                    AI 분석 시작하기
                </button>
            </div>
        </div>
        
        {/* 2. Metrics Section (8000+, 3000+ style) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <MetricCard value="92%" label="분석 정확도" icon="✅"/>
            <MetricCard value="3s" label="최소 응답 시간" icon="⏱️"/>
            <MetricCard value="10+" label="주요 알러지원" icon="🛡️"/>
            <MetricCard value="실시간" label="데이터 업데이트" icon="🔄"/>
        </div>

        {/* 3. Feature Highlight Section */}
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white font-sans-kr border-l-4 border-violet-600 pl-3">AI-Foodie의 핵심 분석 서비스</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SimplifiedFeatureCard title="OCR 성분 인식" icon="📸" description="복잡한 성분표도 오류 없이 즉시 스캔"/>
                <SimplifiedFeatureCard title="숨은 알러지원 탐지" icon="💡" description="미표기된 교차 오염 위험까지 분석"/>
                <SimplifiedFeatureCard title="나의 알레르기 프로필" icon="👤" description="민감도에 기반한 정확한 위험 예측"/>
            </div>
        </div>
    </div>
);

const MetricCard = ({ value, label, icon }) => (
    <div className="p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-xl space-y-2">
        <div className="text-4xl text-violet-400 mb-2">{icon}</div>
        <p className="text-4xl font-bold text-white font-sans-kr">{value}</p>
        <p className="text-sm text-gray-400 font-sans-kr">{label}</p>
    </div>
);

const SimplifiedFeatureCard = ({ title, description, icon }) => (
    <div className="p-5 bg-gray-800 rounded-xl border border-gray-700 shadow-xl space-y-2 hover:border-violet-500 transition duration-300">
        <div className="text-4xl mb-2">{icon}</div> {/* 아이콘 추가 */}
        <h3 className="text-xl font-bold text-white font-sans-kr">{title}</h3>
        <p className="text-gray-400 text-sm font-sans-kr">{description}</p>
    </div>
);

const InfoView = () => (
    <div className="p-6 space-y-8 bg-gray-900 text-white min-h-[calc(100vh-100px)]">
        <h1 className="text-3xl font-bold text-violet-400 border-b border-gray-700 pb-3 font-sans-kr">회사 정보 및 FAQ</h1>
        
        <div className="space-y-3">
            <h2 className="text-xl font-semibold text-red-400 font-sans-kr">비전</h2>
            <p className="text-gray-300 font-sans-kr">AI-Foodie는 알레르기 환자가 식품 선택의 자유와 안전을 동시에 누릴 수 있는 세상을 만드는 것을 목표로 합니다. AI 기술을 통해 일상의 불안감을 해소합니다.</p>
        </div>
        
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-violet-400 font-sans-kr">자주 묻는 질문 (FAQ)</h2>
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <p className="font-medium text-white font-sans-kr">Q: 분석 정확도는 어느 정도인가요?</p>
                <p className="text-sm text-gray-400 font-sans-kr">A: 시제품 테스트에서 92% 이상의 정확도를 보였습니다. (AI 접근 방법 섹션 참조)</p>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <p className="font-medium text-white font-sans-kr">Q: API 서버 연결이 계속 실패합니다.</p>
                <p className="text-sm text-red-400 font-sans-kr">A: 이는 서버 주소(IP) 또는 포트 포워딩/방화벽 설정 문제일 가능성이 높습니다. 백엔드 서버(FastAPI)가 `--host 0.0.0.0`로 실행 중인지 확인하고, 공유기 설정에서 8000번 포트를 열어주세요.</p>
            </div>
        </div>
        
        <footer className="text-center text-sm text-gray-600 pt-4 border-t border-gray-700 font-sans-kr">
            © 2025 AI-Foodie. All rights reserved.
        </footer>
    </div>
);


/* =========================================================================
 * MAIN APP
 * ========================================================================= */

// Main Application Component
// Main Application Component
const App = () => {
  // isAuthReady 상태는 이제 항상 true입니다.
  const [isAuthReady] = useState(true); 

  // State for App Logic
  const [currentPage, setCurrentPage] = useState(PAGES.HOME); 
  const [scanState, setScanState] = useState(PAGES.CAMERA); 
  const [scanResult, setScanResult] = useState(null);
  const [isSaving] = useState(false); 

  /* -----------------------------------------------------------
   * [수정됨] LocalStorage 연동: 새로고침해도 데이터가 유지되도록 변경
   * ----------------------------------------------------------- */
  
  // 1. userAllergies: 저장된 값이 있으면 불러오고, 없으면 빈 배열 []
  const [userAllergies, setUserAllergies] = useState(() => {
    try {
      const saved = localStorage.getItem('userAllergies');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("알레르기 정보 로드 실패", e);
      return [];
    }
  });

  // 2. scanHistory: 저장된 값이 있으면 불러오고, 없으면 빈 배열 []
  const [scanHistory, setScanHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('scanHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("스캔 기록 로드 실패", e);
      return [];
    }
  });

  // 3. useEffect: userAllergies가 변할 때마다 자동으로 저장
  useEffect(() => {
    localStorage.setItem('userAllergies', JSON.stringify(userAllergies));
  }, [userAllergies]);

  // 4. useEffect: scanHistory가 변할 때마다 자동으로 저장
  useEffect(() => {
    localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
  }, [scanHistory]);
  
  // --- API 연동 함수 (시뮬레이션만 남김) ---
  const sendImageForScan = async (file) => {
    // 1. Move to loading state
    setScanState(PAGES.LOADING);

    // 2. Simulate network delay and processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Simulate API Response based on user's allergies
    const hasCriticalAllergen = userAllergies.some(a => a.includes('땅콩') || a.includes('새우'));
    const hasCautionAllergen = userAllergies.some(a => a.includes('우유') || a.includes('계란'));
    
    let result = {};

    if (hasCriticalAllergen) {
      result = {
        status: 'DANGER',
        message: '🚨 고객님이 선택하신 알레르기 성분 (땅콩 또는 새우)이 검출되었습니다.',
        detail: ['땅콩 추출물 (Peanut Extract)', '글루텐 (Gluten)'],
      };
    } else if (hasCautionAllergen) {
      result = {
        status: 'CAUTION',
        message: '⚠️ 알레르기 유발 가능 성분 또는 교차 오염 위험이 있는 성분이 확인되었습니다.',
        detail: ['유청단백 (Whey Protein)', '난황액 (Egg Yolk Liquid)'],
      };
    } else {
      result = {
        status: 'SAFE',
        message: '✅ 고객님의 알레르기 목록에 해당하는 위험 성분이 발견되지 않았습니다. 안심하고 섭취하셔도 좋습니다.',
        detail: null,
      };
    }

    // 4. Update state and move to result screen
    setScanResult(result);
    setScanState(PAGES.RESULT);
    
    // 5. 스캔 기록 저장 (로컬 상태 업데이트)
    const newScan = { status: result.status, timestamp: Date.now(), ...result };
    // 스캔 기록을 로컬 상태에 누적 저장
    setScanHistory(prevHistory => [newScan, ...prevHistory.slice(0, 9)]); // 최대 10개 기록 유지
  };
  
  // --- Save User Allergies (로그인 없이 로컬 상태만 사용) ---
  const saveAllergies = useCallback(async (newAllergies) => {
    // 로컬 상태만 업데이트하고 스캔 흐름 시작
    setUserAllergies(newAllergies); 
    setScanState(PAGES.CAMERA); // 스캔 플로우 시작 지점으로 이동
    setCurrentPage(PAGES.SCAN); // 메인 페이지를 스캔 탭으로 전환
  }, []); 

  // --- Navigation & Flow Handlers ---
  const handleAllergySelectionChange = (newAllergies) => {
    setUserAllergies(newAllergies);
  };

  const handleAllergySaveAndContinue = () => {
    saveAllergies(userAllergies); 
  };
  
  const handleScan = (file) => {
    sendImageForScan(file);
  };
  
  const handleRestart = () => {
    setScanResult(null);
    setScanState(PAGES.CAMERA);
  };
  
  // 페이지별 Content 렌더링
  const renderScanFlowContent = () => {
      switch (scanState) {
          case PAGES.CAMERA:
              return <CameraInput onScan={handleScan} />;
          case PAGES.LOADING:
              return (
                <div className="flex flex-col items-center justify-center p-6 space-y-4 h-full bg-gray-900 text-white">
                    <svg className="animate-spin h-10 w-10 text-violet-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-xl font-semibold text-gray-300 font-sans-kr">성분 분석 중...</p>
                    <p className="text-sm text-gray-500 font-sans-kr">AI 모델이 위험도를 분석하고 있습니다.</p>
                </div>
              );
          case PAGES.RESULT:
              return <ResultDisplay result={scanResult} onRestart={handleRestart} />;
          default:
              return <div className="text-center p-6 text-red-500 font-sans-kr">스캔 오류</div>;
      }
  }
  
  const renderContent = () => {
    // isAuthReady가 항상 true이므로, 바로 컨텐츠를 렌더링합니다.
    switch (currentPage) {
      case PAGES.HOME:
        return <HomeView onNavigate={setCurrentPage} />;
      case PAGES.SCAN:
        return renderScanFlowContent();
      case PAGES.ALLERGIES:
        return (
          <AllergySelector
            selectedAllergies={userAllergies}
            onSelectionChange={handleAllergySelectionChange}
            onContinue={handleAllergySaveAndContinue}
          />
        );
      case PAGES.INFO:
          return <InfoView />;
      default:
        return (
          <div className="text-center p-6 text-red-500 font-sans-kr">페이지를 찾을 수 없습니다.</div>
        );
    }
  };

  const finalNavItems = [
    { page: PAGES.HOME, icon: '🏠', title: '홈' },
    { page: PAGES.SCAN, icon: '🔍', title: 'AI 스캔' },
    { page: PAGES.ALLERGIES, icon: '⚙️', title: '설정' }, 
    { page: PAGES.INFO, icon: '💡', title: '정보' },
  ];

  // The main UI structure for a mobile-like web app
  return (
    // 전체 배경은 다크 테마
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-0" style={{ fontFamily: 'Pretendard, sans-serif' }}>
      {/* Pretendard 폰트를 로드하는 CSS 추가 */}
      <style>
        {`
          @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
          
          /* 전체 레이아웃을 웹사이트처럼 넓게 펼칩니다. */
          body {
            background-color: #111827; /* Tailwind gray-900 */
          }
        `}
      </style>
      
      {/* 웹사이트 전체를 감싸는 컨테이너 */}
      <div className="w-full max-w-7xl min-h-screen bg-gray-900 shadow-2xl flex flex-col">
        {/* Top Header/Navigation Bar (Global Nav) */}
        <nav className="w-full bg-black/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto flex justify-between items-center py-4 px-6">
                {/* 왼쪽 상단 AI-Foodie 버튼 클릭 시 홈화면으로 이동 */}
                <h1 
                    className="text-2xl font-extrabold text-violet-400 font-sans-kr cursor-pointer hover:text-white transition duration-150"
                    onClick={() => setCurrentPage(PAGES.HOME)}
                >
                    AI-Foodie <span className="text-gray-600 text-sm font-medium ml-2">v1.0</span>
                </h1>
                
                {/* Desktop Navigation Links (AI 스캔, 설정 제거) */}
                <div className="hidden md:flex space-x-6">
                    {/* 상단바에서 'AI 스캔'과 '설정' 링크를 제거하고 '홈'과 '정보'만 남깁니다. */}
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); setCurrentPage(PAGES.HOME); }}
                        className={`text-sm font-semibold transition duration-150 py-1 px-2 rounded-lg font-sans-kr
                            ${currentPage === PAGES.HOME 
                                ? 'text-white bg-violet-700/50' 
                                : 'text-gray-300 hover:text-violet-400 hover:bg-gray-800'}`}
                    >
                        홈
                    </a>
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); setCurrentPage(PAGES.INFO); }}
                        className={`text-sm font-semibold transition duration-150 py-1 px-2 rounded-lg font-sans-kr
                            ${currentPage === PAGES.INFO 
                                ? 'text-white bg-violet-700/50' 
                                : 'text-gray-300 hover:text-violet-400 hover:bg-gray-800'}`}
                    >
                        정보
                    </a>
                </div>
                
                {/* 상단 버튼은 이미 제거되었습니다. */}
            </div>
        </nav>
        
        {/* Content Area (Main View) */}
        <main className="flex-grow flex flex-col justify-start w-full mx-auto">
          {renderContent()}
        </main>
        
        {/* Mobile Footer/Bottom Navigation (Hidden on Desktop) */}
        <footer className="md:hidden flex justify-around border-t border-gray-800 bg-gray-900 sticky bottom-0 z-10">
            {finalNavItems.map(item => (
                <button
                    key={item.page}
                    onClick={() => setCurrentPage(item.page)}
                    className={`py-2 px-4 flex flex-col items-center text-xs font-semibold transition duration-150 font-sans-kr
                        ${currentPage === item.page ? 'text-violet-400' : 'text-gray-500 hover:text-violet-300'}`}
                >
                    <span className="text-xl mb-1">{item.icon}</span>
                    {item.title}
                </button>
            ))}
        </footer>
        
      </div>
    </div>
  );
};

export default App;