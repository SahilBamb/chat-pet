import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import config from './config.json';
import { Pet, Badge } from './classes';


function App() {

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [score, setScore] = useState(0);
  const [serverStatus, setServerStatus] = useState(true);
  const [url, setURL] = useState("http://"+config.localEndUrl);
  const [isServerRunning, setIsServerRunning] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const messageContainerRef = useRef(null);
  const [userId, setUserId] = useState('');
  const [imageId, setImageId] = useState(new Pet(config.pet.nervfish));
  const [inventory, setInventory] = useState([new Badge('kinesisGirl')]);
  const [allImages, setAllImages] = useState(['kinesisGirl', 'jar' ]);
  const [autochatting, setAutochatting] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);


  // Login/Register User
  const loginRegisterUser = () => {
    let storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      storedUserId = uuidv4();
      localStorage.setItem('userId', storedUserId);
    }
    setUserId(storedUserId);
  };

  // Check Server Status
  const checkServerStatus = async () => {
    try {
      console.log('Checking server status...');
      const response = await fetch(url + '/messages');
      if (!response.ok) {
        throw new Error('Server not running');
      }
      const data = await response.json();
      console.log('Initial messages loaded:', data);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setServerStatus(false);
      setIsServerRunning(false);
      setShowPopup(true);
    }
  };

  // Initalize App
  const initalize = () => {
    loginRegisterUser();
    checkServerStatus();
  }

  useEffect(() => {
    initalize();
    const ws = new WebSocket(`ws://${window.location.hostname}:3000`);

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('WebSocket message received:', message);
      if (message.type === 'update') {
        console.log('Updating messages with:', message.data);
        setMessages(message.data);
        updateScore(message.data);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, [url]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const submittableMessage = { 
      type: "usermessage", 
      text: inputValue, 
      userId: userId, 
      imageId: imageId 
    };

    console.log('Submitting message with user ID:', userId);

    try {
      const response = await fetch(url + '/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submittableMessage),
      });

      if (response.ok) {
        const savedMessage = await response.json();
        console.log('Saved message:', savedMessage);
        setInputValue('');
        const messages = await fetch(url + '/messages').then(res => res.json());
        setMessages(messages);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error submitting message:', error);
      setMessages([...messages, submittableMessage]);
      setInputValue('');
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      requestAnimationFrame(() => {
        messageContainerRef.current.scrollTo({
          top: messageContainerRef.current.scrollHeight,
          behavior: shouldAutoScroll ? 'smooth' : 'auto'
        });
      });
    }
  };

  const updateScore = (messages) => {
    const totalScore = messages.reduce((acc, message) => {
      const messageUserId = message.user_id || message.userId;
      if (messageUserId === userId) {
        return acc + (message.score + 1);
      }
      return acc;
    }, 0);
    setScore(totalScore);
  };

  const incrementScore = async (messageId) => {
    try {
      const response = await fetch(url + '/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId }),
      });
      if (response.ok) {
        const messages = await fetch(url + '/messages').then(res => res.json());
        setMessages(messages);
      }
    } catch (error) {
      console.error('Error voting on message:', error);
    }
  };


  const squares = Array.from({ length: 40 }, (_, index) => (
    <div className="square" key={index}>
      <img className="item" src={config.slowpoke} alt="React Logo" />
    </div>
  ));

  const interpolateColor = (score) => {
    const hue = (score * 10) % 360;
    return `hsl(${hue}, 100%, 50%)`;
  };

  useEffect(() => {
    let interval;
    if (autochatting) {
      interval = setInterval(addAutoMessage, 1000);
    } else if (!autochatting && interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [autochatting]);

  const addAutoMessage = () => {
    setMessages(prevMessages => [
      ...prevMessages,
      { type: 'automessage', text: 'This is an auto-generated message.', score: 0, userId: userId, imageId: imageId },
    ]);
    setScore(prevScore => prevScore + 1);
    scrollToBottom();
  };


  const adoptPet = async (index, messageId) => {
    try {
      const response = await fetch(url + '/adopt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          index, 
          messageId,
          userId 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the user's pet
        setImageId(new Pet(config.pet[data.petName]));
        
        // Update messages to reflect the removed pet
        const messagesResponse = await fetch(url + '/messages');
        const messages = await messagesResponse.json();
        setMessages(messages);
      }
    } catch (error) {
      console.error('Error adopting pet:', error);
    }
  };


  const buyItem = async (itemIndex, messageId) => {
    try {
      const response = await fetch(url + '/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          itemIndex, 
          messageId,
          userId 
        }),
      });
      if (response.ok) {
        const data = await response.json();
        // Update inventory
        const inventoryResponse = await fetch(`${url}/inventory/${userId}`);
        const inventory = await inventoryResponse.json();
        setInventory(inventory);
        // Update messages
        const messagesResponse = await fetch(url + '/messages');
        const messages = await messagesResponse.json();
        setMessages(messages);
      }
    } catch (error) {
      console.error('Error buying item:', error);
    }
  };

  const aiMessageComponent = (message) => {
    return (
      <div className="message ai">
        <img className="messageItem" src={message.imageId.image.avatar} alt="Avatar" />
        <div className="messageText">{message.text}</div>
      </div>
    );
  };

  // TODO: Implement a more programmatic solution instead of component for each type of message
  const breederMessageComponent = (message) => {
    return (
      <div className={"message breeder glowing" + (message.breeder.messageColor ? " " + message.breeder.messageColor : "")}>
        <img className="messageShopkeeper" src={message.breeder.avatar} alt="Store" />
        <div className="buyableItems">
          {message.breeder.petInventory.map((item, index) => (
            <img 
              className="adoptableItem" 
              src={config.pet[item].avatar} 
              alt={item} 
              key={index} 
              onClick={() => adoptPet(index, message.id)}
            />
          ))} 
        </div>
      </div>
    );
  }

  const shopKeeperMessageComponent = (message) => {
    return (
      <div className={"message shopkeeper" + (message.shopkeeper.messageColor ? " " + message.shopkeeper.messageColor : "")}>
        <img className="messageShopkeeper" src={message.shopkeeper.avatar} alt="Store" />
        <div className="buyableItems">
          {message.shopkeeper.storeInventory.map((item, index) => (
            <img 
              className="buyableItem" 
              src={config[item]} 
              alt="item" 
              key={index} 
              onClick={() => buyItem(index, message.id)}
            />
          ))}
        </div>
      </div>
    );
  };

  const userMessageComponent = (message) => {
    console.log('Message:', message);
    console.log('Message User ID:', message.user_id || message.userId);
    console.log('Current User ID:', userId);
    console.log('Are IDs equal?', (message.user_id || message.userId) === userId);

    // Default avatar for AI messages if imageId is missing
    const defaultAvatar = '/assets/pet/nervfish.jpg';
    const messageAvatar = message.imageId?.image?.avatar || defaultAvatar;

    return (
      <div
        className={"message" + ((message.user_id || message.userId) === userId ? " own" : "")}
        key={message.id}
        onClick={() => incrementScore(message.id)}
      >
        <img className="messageItem" src={messageAvatar} alt="Avatar" />
        <div className="messageText">{message.text}</div>
        {message.score > 0 && (
          <div className="messageScore"
            style={{ backgroundColor: interpolateColor(message.score) }}>
            +{Math.min(99, message.score)}
          </div>
        )}
      </div>
    );
  };

  const MessyTypingEffect = () => {
    const [text, setText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ranFont, setRanFont] = useState("");
    const texts = ['ChatPet', 'ChattyPetty', 'ChattyPet', 'ChatPetty'];
    const typingSpeed = 150; // milliseconds
    const deletingSpeed = 300; // milliseconds
    const pauseTime = 10000; // milliseconds
  
    const charIndexRef = useRef(0);
    const isDeletingRef = useRef(false);
  
    useEffect(() => {
      const type = () => {
        const charIndex = charIndexRef.current;
        const isDeleting = isDeletingRef.current;
        const fullText = texts[currentIndex];
  
        if (!isDeleting && charIndex < fullText.length) {
          setText((prev) => prev + fullText[charIndex]);
          charIndexRef.current++;
          setTimeout(type, typingSpeed);
        } else if (isDeleting && charIndex > 0) {
          setText((prev) => prev.slice(0, -1));
          charIndexRef.current--;
          setTimeout(type, deletingSpeed);
        } else if (charIndex === fullText.length) {
          isDeletingRef.current = true;
          setTimeout(type, pauseTime);
        } else if (charIndex === 0) {
          isDeletingRef.current = false;
          if (Math.random() < 0.2) {
            setCurrentIndex(Math.floor(Math.random() * texts.length));
          }
          else {
            setCurrentIndex(0);
          }

          setTimeout(type, pauseTime);
        }
      };
  
      type();
    }, [currentIndex]);
  
    return <div className="brandName">{text}</div>;
  };
  

  const autoMessageComponent = (message, index) => {
    return (
      <div
        className={"message auto" + (message.userId === userId ? " own" : "")}
        key={index}
        id={`message-${index}`}
        onClick={() => incrementScore(index)}
      >
        <img className="messageItem" src={message.imageId.image.avatar} alt="React Logo" />
        <div className="messageText" key={index}>{message.text}</div>
        {(message.score > 0) && <div className="messageScore"
          style={{ backgroundColor: interpolateColor(message.score) }}
          key={index}>+{Math.min(99, message.score)}</div>}
      </div>
    );
  };

  const handleScroll = () => {
    if (messageContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
      const scrollPosition = scrollHeight - scrollTop - clientHeight;
      const isClose = scrollPosition < 100;
      setIsNearBottom(isClose);
      setShouldAutoScroll(isClose);
    }
  };

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

  return (
    <>
      <div className="topRow">
        {/* <MessyTypingEffect /> */}
        <div className="brandName">ChatPet</div>
        <div className="profile">
          <div className="badges">
            {imageId.badges.map((badge, index) => (
              <div key={index}>
                <div className="badge-container">
                  <img className="badge" src={config[badge.image]} alt="badge" />
                  <div className="badge-count">{badge.count}</div>
                </div>
              </div>
            ))}
          </div>
          <img className="profilePictureSquare" src={imageId.image.avatar} />
        </div>
      </div>
      <div className="boxes">
        <div className="bag">
          <div className="inventory">
            <div className="square buy">
              <img className="item faded" src={config.questionmark} alt="item" onClick={() =>
                {
                  setInventory([...inventory, new Badge(allImages[Math.floor(Math.random() * allImages.length)])]);
                }
              } />
            </div>
            {inventory.map((item, index) => {
              const badge = item instanceof Badge ? item : new Badge(item);
              return (
                <div className="square" key={index}>
                  <img 
                    className="item" 
                    src={config[badge.image]} 
                    alt="item" 
                    key={index} 
                    onClick={() => {
                      badge.use({imageId, index, setInventory, inventory});
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="score">${score}</div>
        </div>
        <div className="box">
          <div 
            className="messageContainer" 
            ref={messageContainerRef}
            onScroll={handleScroll}
          >
            {showPopup && <div className="popup">You are only chatting locally!</div>}
            {messages.map((message) => (
              <React.Fragment key={message.id}>
                {message.type === 'usermessage' && userMessageComponent(message)}
                {message.type === 'shopkeepermessage' && shopKeeperMessageComponent(message)}
                {message.type === 'breedermessage' && breederMessageComponent(message)}
                {message.type === 'aimessage' && aiMessageComponent(message)}
              </React.Fragment>
            ))}
          </div>
          <div className="buttons">
            <form className="inputCheck" onSubmit={handleSubmit}>
            {autochatting ? 
              <>
                <input disabled placeholder="You are autochatting & generating points automatically :)" maxLength="100" type="text" value={inputValue} onChange={handleInputChange} />
                <button disabled type="submit">Submit</button>
              </>:
              <>
                <input maxLength="75" type="text" value={inputValue} onChange={handleInputChange} />
                <button type="submit">Submit</button>
              </>
            }
              <button 
              type="button"
              className={autochatting ? "autoChattingButtonOn" : "autoChattingButtonOff"}
              onClick={() => {
                setAutochatting(prevAutochatting => !prevAutochatting);
              }}
            >Auto</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;