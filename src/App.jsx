/* eslint-disable no-undef */ 
import React, { useState, useEffect, useCallback, useRef } from 'react';

// Firebase Imports: 사용자 인증 및 데이터 저장을 위해 다시 활성화합니다.
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, getDocs, orderBy, limit, serverTimestamp, onSnapshot } from 'firebase/firestore'; 

// --- Global Variables (Canvas 환경 변수 재정의) ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? initialAuthToken : null;
// --- End Global Variables ---


// Define App Pages (Expanded for company structure)
const PAGES = {
  HOME: 'home',       // 메인 대시보드
  SCAN: 'scan',       // 메인 기능
  PROFILE: 'profile', // 새로운 프로필 페이지 (스캔 기록, 설정)
  ALLERGIES: 'allergies', // 알레르기 설정
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
      <h1 className="text-3xl font-bold text-violet-400 font-sans-kr">프로필 설정 (나의 알레르기)</h1>
      <p className="text-gray-400 font-sans-kr">가지고 계신 알레르기 항목을 모두 선택해 주세요.</p>

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
        onClick={onContinue}
        className="w-full py-3 px-4 text-white font-bold rounded-xl transition duration-150 bg-violet-600 hover:bg-violet-700 shadow-lg transform hover:scale-[1.01] font-sans-kr"
      >
        설정 완료 및 AI 스캔 시작
      </button>
      <p className="text-xs text-gray-500 text-center font-sans-kr">알레르기 정보는 안전 진단을 위해 사용됩니다.</p>
    </div>
  );
};

const ProfileView = ({ user, scanHistory, onNavigate, onLogout }) => {
  const totalScans = scanHistory.length;
  const lastScan = totalScans > 0 ? new Date(scanHistory[0].timestamp).toLocaleDateString('ko-KR') : '없음';

  // 가장 높은 위험 등급 계산
  const severityMap = { DANGER: 3, CAUTION: 2, SAFE: 1 };
  const highestSeverity = scanHistory.reduce((max, scan) => {
    return Math.max(max, severityMap[scan.status]);
  }, 0);
  
  const statusColor = highestSeverity === 3 ? 'text-red-500' : highestSeverity === 2 ? 'text-yellow-500' : 'text-green-500';
  const statusText = highestSeverity === 3 ? '위험 (DANGER)' : highestSeverity === 2 ? '주의 (CAUTION)' : '안전 (SAFE)';

  return (
    <div className="p-8 space-y-8 bg-gray-900 text-white min-h-[calc(100vh-100px)]">
      <h1 className="text-3xl font-extrabold text-violet-400 font-sans-kr border-b border-gray-700 pb-3">
        사용자 대시보드
      </h1>

      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg space-y-4">
        <p className="text-lg font-semibold text-white font-sans-kr">
          환영합니다, <span className="text-violet-400">{user.isLoggedIn ? user.userId.substring(0, 8) + '...' : '방문자'}</span>님!
        </p>
        <button
            onClick={user.isLoggedIn ? onLogout : () => { /* 로그인/회원가입 모달 열기 로직 */ }}
            className={`py-2 px-4 rounded-lg text-sm font-bold transition duration-150 font-sans-kr
                ${user.isLoggedIn ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
        >
            {user.isLoggedIn ? '로그아웃' : '로그인 / 회원가입'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-800 rounded-xl border border-gray-700">
          <p className="text-sm text-gray-400 font-sans-kr">총 스캔 횟수</p>
          <p className={`text-3xl font-bold text-white font-sans-kr mt-1`}>{totalScans}</p>
        </div>
        <div className="p-4 bg-gray-800 rounded-xl border border-gray-700">
          <p className="text-sm text-gray-400 font-sans-kr">누적 최고 위험</p>
          <p className={`text-xl font-bold ${statusColor} font-sans-kr mt-1`}>{statusText}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-violet-400 font-sans-kr border-b border-gray-800 pb-2">
            나의 스캔 기록 (최신순)
        </h2>
        <div className="max-h-64 overflow-y-auto space-y-3">
          {scanHistory.length === 0 ? (
            <p className="text-gray-500 font-sans-kr">아직 스캔 기록이 없습니다. AI 스캔을 시작해 보세요!</p>
          ) : (
            scanHistory.map((scan, index) => (
              <div key={index} className="p-3 bg-gray-800 rounded-lg border border-gray-700 flex justify-between items-center">
                <span className={`font-semibold ${colorMap[scan.status].accent} font-sans-kr`}>
                  {scan.status.toUpperCase()}
                </span>
                <span className="text-sm text-gray-400 font-sans-kr">{new Date(scan.timestamp).toLocaleDateString('ko-KR')}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <button
          onClick={() => onNavigate(PAGES.ALLERGIES)}
          className="w-full py-3 px-4 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-600 transition font-sans-kr"
      >
          알레르기 프로필 수정하기
      </button>
    </div>
  );
};

const HomeView = ({ onNavigate }) => (
    <div className="p-8 space-y-12 bg-gray-900 text-white min-h-[calc(100vh-100px)]">
        
        {/* 1. Hero Section (문구 수정: "IT 전문가를 위한" 제거) */}
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
                    onClick={() => onNavigate(PAGES.SCAN)}
                    className="py-3 px-8 bg-violet-600 text-white font-bold rounded-full shadow-lg shadow-violet-500/50 hover:bg-violet-700 transition font-sans-kr transform hover:scale-105"
                >
                    AI 분석 시작하기
                </button>
            </div>
        </div>
        
        {/* 2. Metrics Section (8000+, 3000+ style) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
                <p className="text-3xl font-bold text-violet-400 font-sans-kr">92%</p>
                <p className="text-sm text-gray-400 font-sans-kr">분석 정확도</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
                <p className="text-3xl font-bold text-violet-400 font-sans-kr">3s</p>
                <p className="text-sm text-gray-400 font-sans-kr">최소 응답 시간</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-xl border border-gray-700 shadow-lg hidden lg:block">
                <p className="text-3xl font-bold text-violet-400 font-sans-kr">10+</p>
                <p className="text-sm text-gray-400 font-sans-kr">주요 알러지원</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-xl border border-gray-700 shadow-lg hidden lg:block">
                <p className="text-3xl font-bold text-violet-400 font-sans-kr">실시간</p>
                <p className="text-sm text-gray-400 font-sans-kr">데이터 업데이트</p>
            </div>
        </div>

        {/* 3. Feature Highlight Section (Class별 강좌 style) */}
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white font-sans-kr border-l-4 border-violet-600 pl-3">AI-Foodie의 핵심 분석 서비스</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FeatureCard title="개인 맞춤형 프로필" icon="👤" description="민감도에 기반한 정확한 위험 예측"/>
                <FeatureCard title="OCR 성분 인식" icon="📸" description="복잡한 성분표도 오류 없이 즉시 스캔"/>
                <FeatureCard title="숨은 알러지원 탐지" icon="💡" description="미표기된 교차 오염 위험까지 분석"/>
            </div>
        </div>
    </div>
);

const FeatureCard = ({ title, description, icon }) => (
    <div className="p-5 bg-gray-800 rounded-xl border border-gray-700 shadow-xl space-y-2 hover:border-violet-500 transition duration-300">
        <div className="text-4xl mb-2">{icon}</div>
        <h3 className="text-xl font-bold text-white font-sans-kr">{title}</h3>
        <p className="text-gray-400 text-sm font-sans-kr">{description}</p>
        <button className="text-violet-400 text-sm font-semibold mt-2 font-sans-kr hover:underline">자세히 보기 &gt;</button>
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
const App = () => {
  // State for Firebase - 다시 활성화
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false); // 인증 상태 확인용

  // State for App Logic
  const [currentPage, setCurrentPage] = useState(PAGES.HOME); 
  const [scanState, setScanState] = useState(PAGES.CAMERA); 
  const [userAllergies, setUserAllergies] = useState([]);
  const [scanResult, setScanResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false); 
  const [scanHistory, setScanHistory] = useState([]); // 스캔 기록 누적 저장
  
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
    
    // 5. 스캔 기록 저장 (인증된 사용자일 경우만)
    if (userId && db) {
        saveScanResult(result);
    }
  };
  
  // --- Firebase Initialization and Authentication ---
  useEffect(() => {
    if (!firebaseConfig) {
      console.warn("Firebase config is missing. Proceeding to simulation mode.");
      setIsAuthReady(true);
      return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const authentication = getAuth(app);
      setDb(firestore);
      setAuth(authentication);

      // 익명 로그인 시도 (로그인 창 오류를 피하기 위해 onAuthStateChanged 내에서 처리하지 않음)
      const authenticate = async () => {
        try {
          if (initialAuthToken) {
            // 이전에 토큰이 있다면 Custom Token으로 로그인 시도
            // alert('Custom Token Login is not implemented in this demo.'); 
            await signInAnonymously(authentication); // 익명 로그인으로 대체
          } else {
            // 토큰이 없다면 익명 로그인 시도
            await signInAnonymously(authentication); 
          }
        } catch (error) {
          console.error("Firebase Auth failed:", error);
        }
      };
      
      // Auth State Listener 설정
      const unsubscribe = onAuthStateChanged(authentication, (user) => {
        if (user) {
          setUserId(user.uid);
          console.log("User authenticated:", user.uid);
        } else {
          setUserId(null);
          console.log("No user authenticated.");
        }
        setIsAuthReady(true); // 인증 체크 완료
      });

      authenticate();
      return () => unsubscribe();

    } catch (error) {
      console.error("Error initializing Firebase:", error);
      setIsAuthReady(true);
    }
  }, []);

  // --- Firestore: Load User Data & Scan History (실시간 리스너 사용) ---
  useEffect(() => {
    // 인증 준비가 안 되었거나, db나 userId가 없으면 실행하지 않음
    if (!isAuthReady || !db || !userId) return;

    // 1. 알레르기 정보 로드 리스너
    const allergyDocRef = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'allergies');
    const unsubscribeAllergies = onSnapshot(allergyDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const savedAllergies = data.allergies || [];
        setUserAllergies(savedAllergies);
      } else {
        console.log("No existing allergy data found.");
      }
    }, (error) => {
      console.error("Error fetching allergy data:", error);
    });

    // 2. 스캔 기록 로드 리스너
    const scansCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'scans');
    // 최신순 10개만 로드하도록 쿼리 설정
    const q = query(scansCollectionRef, orderBy('timestamp', 'desc'), limit(10));
    
    const unsubscribeScans = onSnapshot(q, (snapshot) => {
        const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setScanHistory(history);
    }, (error) => {
        console.error("Error fetching scan history:", error);
    });
    
    // 클린업 함수
    return () => {
        unsubscribeAllergies();
        unsubscribeScans();
    };

  }, [isAuthReady, db, userId]);

  // --- Firestore: Save User Allergies ---
  const saveAllergies = useCallback(async (newAllergies) => {
    if (!db || !userId) {
      console.warn("Firebase not ready. Skipping save and proceeding to camera screen.");
      setUserAllergies(newAllergies); 
      setScanState(PAGES.CAMERA); 
      setCurrentPage(PAGES.SCAN);
      return; 
    }
    
    setIsSaving(true);
    const allergyDocRef = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'allergies');
    
    try {
      await setDoc(allergyDocRef, {
        allergies: newAllergies,
        updatedAt: serverTimestamp(),
      });
      setUserAllergies(newAllergies); 
      setScanState(PAGES.CAMERA); 
      setCurrentPage(PAGES.SCAN);
    } catch (error) {
      console.error("Error saving allergy data:", error);
    } finally {
      setIsSaving(false);
    }
  }, [db, userId, appId]);
  
  // --- Firestore: Save Scan Result (누적 저장) ---
  const saveScanResult = useCallback(async (result) => {
      if (!db || !userId) {
          console.warn("Firebase not ready. Scan result not saved.");
          return;
      }
      
      const scansCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'scans');
      
      try {
          // 스캔 기록에 결과와 타임스탬프를 저장
          await setDoc(doc(scansCollectionRef), {
              status: result.status,
              message: result.message,
              detected_allergens: result.detail || [],
              timestamp: serverTimestamp(),
          });
      } catch (error) {
          console.error("Error saving scan result:", error);
      }
  }, [db, userId, appId]);

  // --- Logout Handler ---
  const handleLogout = useCallback(async () => {
      if (!auth) return;
      try {
          await signOut(auth);
          setScanHistory([]); // 기록 초기화
          setCurrentPage(PAGES.HOME);
      } catch (error) {
          console.error("Logout failed:", error);
      }
  }, [auth]);


  // --- Navigation & Flow Handlers ---
  const handleAllergySelectionChange = (newAllergies) => {
    setUserAllergies(newAllergies);
  };

  const handleAllergySaveAndContinue = () => {
    // ALLERGIES 페이지에서 PROFILE 페이지로 네비게이션을 위해 saveAllergies 호출
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
    // 인증 대기 중에는 로딩 화면을 보여줌
    if (!isAuthReady && firebaseConfig) {
        return (
            <div className="flex items-center justify-center p-16 h-full bg-gray-900 text-white font-sans-kr">
                <svg className="animate-spin h-8 w-8 text-violet-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                인증 및 데이터 로딩 중...
            </div>
        );
    }

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
      case PAGES.PROFILE: // 새로운 프로필 뷰 추가
        return (
            <ProfileView 
                user={{ isLoggedIn: !!userId, userId: userId || 'N/A' }} 
                scanHistory={scanHistory} 
                onNavigate={setCurrentPage} 
                onLogout={handleLogout}
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

  const navItems = [
      { page: PAGES.HOME, icon: '🏠', title: '홈' },
      { page: PAGES.SCAN, icon: '🔍', title: 'AI 스캔' },
      { page: PAGES.PROFILE, icon: '👤', title: '프로필' },
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
                <h1 className="text-2xl font-extrabold text-violet-400 font-sans-kr">
                    AI-Foodie <span className="text-gray-600 text-sm font-medium ml-2">v1.0</span>
                </h1>
                
                {/* Desktop Navigation Links */}
                <div className="hidden md:flex space-x-6">
                    {navItems.map(item => (
                        <a
                            key={item.page}
                            href="#"
                            onClick={(e) => { e.preventDefault(); setCurrentPage(item.page); }}
                            className={`text-sm font-semibold transition duration-150 py-1 px-2 rounded-lg font-sans-kr
                                ${currentPage === item.page 
                                    ? 'text-white bg-violet-700/50' 
                                    : 'text-gray-300 hover:text-violet-400 hover:bg-gray-800'}`}
                        >
                            {item.title}
                        </a>
                    ))}
                </div>
                
                <button 
                    className="text-sm text-gray-400 hover:text-white transition font-sans-kr"
                    onClick={() => setCurrentPage(PAGES.PROFILE)} // 프로필 버튼을 프로필 뷰로 연결
                >
                    {userId ? '내 프로필' : '로그인'}
                </button>
            </div>
        </nav>
        
        {/* Content Area (Main View) */}
        <main className="flex-grow flex flex-col justify-start w-full mx-auto">
          {renderContent()}
        </main>
        
        {/* Mobile Footer/Bottom Navigation (Hidden on Desktop) */}
        <footer className="md:hidden flex justify-around border-t border-gray-800 bg-gray-900 sticky bottom-0 z-10">
            {navItems.map(item => (
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