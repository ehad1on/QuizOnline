import { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import "./styles.css"; // Add this line for CSS animations

function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timer, setTimer] = useState(20); // Changed to 20 seconds
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchQuestions = async () => {
      const querySnapshot = await getDocs(collection(db, "questions"));
      const fetchedQuestions = querySnapshot.docs.map(doc => doc.data());
      setQuestions(fetchedQuestions);
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (questions.length === 0 || finished) return;

    setTimer(20); // Changed to 20 seconds
    setMessage("");

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev === 1) {
          clearInterval(interval);
          setMessage("Time out!");
          setTimeout(() => {
            nextQuestion();
          }, 1000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [index, questions, finished]);

  const handleAnswer = (i) => {
    if (i === questions[index].correct) {
      setScore(score + 1);
    }
    nextQuestion();
  };

  const nextQuestion = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else {
      setFinished(true);
    }
  };

  if (questions.length === 0) return <div className="loading">Loading...</div>;
  if (finished) return <div className="result">Rezultat: {score}/{questions.length}</div>;

  const q = questions[index];
  const progressPercentage = (timer / 20) * 100; // Changed to 20 seconds
  const progressColor = progressPercentage > 50 ? 
    `hsl(${progressPercentage * 1.2}, 100%, 50%)` : 
    `hsl(0, 100%, ${50 + progressPercentage}%)`;

  return (
    <div className="quiz-container">
      <h2>{q.question}</h2>
      <div className="timer-container">
        <div 
          className="timer-bar"
          style={{
            width: `${progressPercentage}%`,
            backgroundColor: progressColor
          }}
        ></div>
        <span className="timer-text">{timer}s</span>
      </div>
      {message && <p className="timeout-message">{message}</p>}
      <div className="options-container">
        {q.options.map((opt, i) => (
          <button 
            onClick={() => handleAnswer(i)} 
            key={i} 
            disabled={!!message}
            className="option-button"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Quiz;