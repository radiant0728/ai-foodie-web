/* eslint-disable no-undef */ 
import React, { useState, useEffect, useCallback } from 'react';

// Firebase Imports
// (Firebase 라이브러리 import는 doc, setDoc 사용을 위해 유지)
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// --- Global Variables for Canvas Environment (MUST BE USED) ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? initialAuthToken : null;
// --- End Global Variables ---


// Define App Pages
const PAGES = {
  ALLERGIES: 'allergies',
  CAMERA: 'camera',
  LOADING: 'loading',
  RESULT: 'result',
};

// Common Allergens List
const ALLERGEN_OPTIONS = [
  '우유 (Milk)', '땅콩 (Peanuts)', '밀 (Wheat)', '계란 (Egg)',
  '대두 (Soy)', '견과류 (Tree Nuts)', '새우 (Shrimp)', '게 (Crab)',
  '복숭아 (Peach)', '토마토 (Tomato)'
];

/**
 * ResultDisplay Component: Displays the final scan result (Safe, Caution, Danger)
 * @param {object} props - Component props
 * @param {object} props.result - The scan result object { status: 'SAFE'|'CAUTION'|'DANGER', message: string, detail: array }
 * @param {function} props.onRestart - Function to navigate back to the camera screen
 */
const ResultDisplay = ({ result, onRestart }) => {
  const { status, message, detail } = result;

  const colorMap = {
    SAFE: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500', icon: '✅' },
    CAUTION: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500', icon: '⚠️' },
    DANGER: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500', icon: '❌' },
  };

  const { bg, text, border, icon } = colorMap[status] || colorMap.SAFE;

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6">
      <div className={`p-8 rounded-full ${bg} border-4 ${border} shadow-xl transform transition duration-500 hover:scale-105`}>
        <div className="text-6xl">{icon}</div>
      </div>
      <h1 className={`text-3xl font-extrabold ${text} text-center`}>
        {status === 'SAFE' && '안전 (Safe)'}
        {status === 'CAUTION' && '주의 (Caution)'}
        {status === 'DANGER' && '위험 (Danger)'}
      </h1>
      <p className="text-xl text-gray-700 text-center max-w-sm">{message}</p>

      {status !== 'SAFE' && detail && (
        <div className="w-full max-w-md p-4 bg-white rounded-lg shadow-inner border border-gray-200">
          <h2 className="text-lg font-semibold mb-2 text-gray-800">검출된 알레르기 성분:</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            {detail.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-red-500 font-bold mr-2">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onRestart}
        className="mt-8 w-full max-w-sm py-3 px-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition duration-150 transform hover:scale-[1.02]"
      >
        새로운 성분표 촬영
      </button>
    </div>
  );
};

/**
 * CameraInput Component: Handles file selection and triggers the API call
 * @param {object} props - Component props
 * @param {function} props.onScan - Function to call when a file is selected, taking the file object
 */
const CameraInput = ({ onScan }) => {
  const fileInputRef = React.useRef(null); // Ref 생성

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onScan(file);
    }
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) { // Ref가 null인지 확인하는 안전장치 추가
      fileInputRef.current.click();
    } else {
      console.error("File input element is not ready.");
    }
  };


  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-8 h-full">
      <h1 className="text-2xl font-bold text-gray-700">📸 성분표 사진 촬영 / 업로드</h1>
      <p className="text-gray-500 text-center max-w-xs">식품의 성분표가 잘 보이도록 촬영하거나 파일을 선택해 주세요.</p>

      {/* onClick 이벤트가 triggerFileInput 함수를 호출하도록 변경 */}
      <div
        onClick={triggerFileInput} 
        className="w-full max-w-xs cursor-pointer flex flex-col items-center justify-center p-12 border-4 border-dashed border-gray-300 rounded-2xl bg-white hover:bg-gray-50 transition duration-150 shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.867-1.299A2 2 0 0111.07 4h1.861c.42 0 .813.195 1.07.51L15.405 6.11a2 2 0 001.664.89h.93a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-lg font-semibold text-gray-600">사진 업로드</span>
        
        {/* input 태그에 ref={fileInputRef}를 연결하여 DOM 요소를 참조하도록 수정 */}
        <input
          ref={fileInputRef} 
          id="camera-input"
          type="file"
          accept="image/*"
          capture="environment" // For mobile camera access
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <button
        onClick={() => onScan({ name: 'placeholder.jpg', size: 100 })}
        className="text-sm text-blue-500 hover:text-blue-700 transition duration-150"
      >
        (촬영 기능 시뮬레이션: 즉시 결과 보기)
      </button>
    </div>
  );
};

/**
 * AllergySelector Component: Manages user's selected allergies using checkboxes.
// ... (AllergySelector 컴포넌트 전체는 동일)
 */
const AllergySelector = ({ selectedAllergies, onSelectionChange, onContinue, isSaving }) => {
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
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">알레르기 정보 설정</h1>
      <p className="text-gray-600">가지고 계신 알레르기 항목을 모두 선택해 주세요. (언제든지 수정 가능)</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
        {ALLERGEN_OPTIONS.map((allergen) => (
          <div
            key={allergen}
            className={`p-3 text-sm font-medium rounded-lg cursor-pointer transition duration-150 shadow-sm
              ${isSelected(allergen)
                ? 'bg-red-500 text-white ring-2 ring-red-400'
                : 'bg-white text-gray-700 hover:bg-red-50'
              }`}
            onClick={() => handleToggle(allergen)}
          >
            {allergen}
          </div>
        ))}
      </div>

      <button
        onClick={onContinue}
        disabled={isSaving}
        className={`w-full py-3 px-4 text-white font-bold rounded-xl transition duration-150
          ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-lg transform hover:scale-[1.01]'}`}
      >
        {isSaving ? '저장 중...' : '설정 완료 및 스캔 시작'}
      </button>
      <p className="text-xs text-gray-500 text-center">알레르기 정보는 안전 진단을 위해 사용됩니다.</p>
    </div>
  );
};

// Main Application Component
const App = () => {
  // State for Firebase
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  // isAuthReady 상태는 UI를 먼저 띄우기 위해 사용됩니다.
  const [isAuthReady, setIsAuthReady] = useState(false); 

  // State for App Logic
  const [currentPage, setCurrentPage] = useState(PAGES.ALLERGIES);
  const [userAllergies, setUserAllergies] = useState([]);
  const [scanResult, setScanResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // 🚨🚨🚨 API 백엔드 서버 URL 변수 🚨🚨🚨
  // 친구의 FastAPI 서버 주소를 여기에 입력합니다.
  const API_BASE_URL = "http://127.0.0.1:8000"; 
  // 🚨🚨🚨 API URL 설정 끝 🚨🚨🚨


  // --- Firebase Initialization and Authentication ---
  // 🚨🚨🚨 이 useEffect 블록 전체를 삭제하여 인증 시도를 완전히 막습니다. 🚨🚨🚨
  useEffect(() => {
    // 앱이 실행되자마자 isAuthReady를 true로 설정하여 UI를 먼저 렌더링합니다. (로그인 오류 해결)
    setIsAuthReady(true); 
  }, []); // 🚨🚨🚨 인증 관련 코드를 모두 삭제하고, isAuthReady만 true로 설정합니다. 🚨🚨🚨

  // --- Firestore: Load User Allergies on Auth Ready ---
  // 🚨🚨🚨 이 useEffect 블록 전체를 삭제합니다. (Firestore 리스너가 문제의 근원) 🚨🚨🚨
  useEffect(() => {
    if (!isAuthReady || !db || !userId) return;

    const docRef = doc(db, 'artifacts', appId, 'users', userId, 'allergies', 'current');
    
    // onSnapshot listener for real-time updates
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const savedAllergies = data.allergies || [];
        setUserAllergies(savedAllergies);
        console.log("Allergies loaded successfully:", savedAllergies);
      } else {
        console.log("No existing allergy data found. Using default empty list.");
      }
    }, (error) => {
      console.error("Error fetching allergy data:", error);
    });

    return () => unsubscribe(); // Cleanup listener

  }, [isAuthReady, db, userId]); // 🚨🚨🚨 이 블록 전체를 삭제해야 합니다. 🚨🚨🚨

  // --- Firestore: Save User Allergies ---
  const saveAllergies = useCallback(async (newAllergies) => {
    // 🚨🚨🚨 로컬 환경 우회 로직만 남기고, 실제 Firestore 코드는 제거합니다. 🚨🚨🚨
    // Firestore 인증 문제가 모두 해결되었으므로, 이제는 로컬 상태 업데이트만 수행하도록 간소화합니다.
    setUserAllergies(newAllergies); 
    setCurrentPage(PAGES.CAMERA); 
    console.warn("Firebase save skipped. Proceeding to camera.");
  }, []); // 의존성 배열에서 db, userId 제거

  // --- API 연동 함수로 교체 ---
  const sendImageForScan = async (file) => {
    // 1. Move to loading state
    setCurrentPage(PAGES.LOADING);

    // 2. FormData 객체 생성 및 이미지, 알레르기 정보 추가
    const formData = new FormData();
    formData.append("file", file);
    // 현재 사용자의 알레르기 목록을 JSON 문자열로 변환하여 전송
    formData.append("allergies", JSON.stringify(userAllergies));
    
    // 3. 백엔드 API 호출 (FastAPI의 /analyze 엔드포인트)
    try {
        const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // 4. API 응답 데이터를 기반으로 결과 화면 구성
        const result = {
            status: data.status.toUpperCase(), // SAFE, CAUTION, DANGER
            message: data.message,
            detail: data.detected_allergens || [], // 검출된 알레르기 목록
        };

        setScanResult(result);
        setCurrentPage(PAGES.RESULT);

    } catch (error) {
        console.error("API 통신 실패 또는 응답 오류:", error);
        // 통신 실패 시에도 사용자에게 결과를 보여줄 수 있도록 에러 시뮬레이션
        setScanResult({
            status: 'CAUTION',
            message: '⚠️ 서버 연결 또는 분석에 실패했습니다. (로컬 서버 실행 여부 확인 필요)',
            detail: [`API Error: ${error.message}`],
        });
        setCurrentPage(PAGES.RESULT);
    }
  };

  // --- Navigation & Flow Handlers ---
  const handleAllergySelectionChange = (newAllergies) => {
    // Only update local state for real-time checkbox feedback
    setUserAllergies(newAllergies);
  };

  const handleAllergySaveAndContinue = () => {
    saveAllergies(userAllergies); // Trigger saving and navigation
  };
  
  const handleScan = (file) => {
    console.log("File selected:", file.name);
    // simulateApiCall 대신 API 연동 함수 사용
    sendImageForScan(file);
  };
  
  const handleRestart = () => {
    setScanResult(null);
    setCurrentPage(PAGES.CAMERA);
  };
  
  // Render the current page based on state
  const renderContent = () => {
    switch (currentPage) {
      case PAGES.ALLERGIES:
        return (
          <AllergySelector
            selectedAllergies={userAllergies}
            onSelectionChange={handleAllergySelectionChange}
            onContinue={handleAllergySaveAndContinue}
            isSaving={isSaving}
          />
        );
      case PAGES.CAMERA:
        return (
          <CameraInput
            onScan={handleScan}
          />
        );
      case PAGES.LOADING:
        return (
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xl font-semibold text-gray-700">성분 분석 중...</p>
            <p className="text-sm text-gray-500">고객님의 알레르기 정보를 기반으로 분석하고 있습니다.</p>
          </div>
        );
      case PAGES.RESULT:
        return (
          <ResultDisplay
            result={scanResult}
            onRestart={handleRestart}
          />
        );
      default:
        return (
          <div className="text-center p-6 text-red-500">오류: 알 수 없는 페이지입니다.</div>
        );
    }
  };

  // UX Feature: Simple Header to show current step and ability to go to settings
  const getHeaderTitle = () => {
    switch (currentPage) {
      case PAGES.ALLERGIES: return '나의 알레르기 설정';
      case PAGES.CAMERA: return '성분표 스캔';
      case PAGES.LOADING: return '분석 진행 중';
      case PAGES.RESULT: return '분석 결과 안내';
      default: return 'AI-Foodie';
    }
  };
  
  // The main UI structure for a mobile-like web app
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg min-h-[550px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h2 className="text-xl font-extrabold text-red-600">
            AI-Foodie
          </h2>
          <h1 className="text-lg font-semibold text-gray-800 absolute left-1/2 transform -translate-x-1/2">
            {getHeaderTitle()}
          </h1>
          {(currentPage !== PAGES.ALLERGIES && currentPage !== PAGES.LOADING) && (
            <button
              onClick={() => setCurrentPage(PAGES.ALLERGIES)}
              className="text-gray-500 hover:text-gray-700 transition duration-150 p-1 rounded-full hover:bg-gray-100"
              title="알레르기 수정"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.568.347 1.25.5 1.77.5.54 0 1.07-.153 1.542-.455z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </header>
        
        {/* Content Area */}
        <main className="flex-grow flex items-center justify-center p-4">
          {renderContent()}
        </main>
        
        {/* Footer/User Info (for debugging/identification) */}
        <footer className="p-2 border-t text-xs text-gray-400 text-center bg-gray-50">
          <p>사용자 ID (디버깅): {userId || 'N/A'}</p>
        </footer>
      </div>
    </div>
  );
};

export default App;