"use client";
import React, { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe, Send, User } from "lucide-react";
import io from "socket.io-client";

export default function Page() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [userName, setUserName] = useState("");
  const [socket, setSocket] = useState(null);
  const [namePrompted, setNamePrompted] = useState(false);

  const messagesEndRef = useRef(null);
  const notificationSoundRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const newSocket = io("https://free-chat-backend-daga.onrender.com", {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    setSocket(newSocket);
    notificationSoundRef.current = new Audio("/sounds/notification.mp3");

    newSocket.on("connect", () => {
      console.log("Connected to server");
    });

    newSocket.on("user-joined", (name) => {
      setMessages((prev) => [
        ...prev,
        { user: "System", message: `${name} has joined the chat!` },
      ]);
    });

    newSocket.on("receive", (data) => {
      setMessages((prev) => [
        ...prev,
        { user: data.name, message: data.message },
      ]);

      if (notificationSoundRef.current) {
        notificationSoundRef.current.play();
      }

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(data.name, { body: data.message });
      }
    });

    newSocket.on("user-left", (name) => {
      setMessages((prev) => [
        ...prev,
        { user: "System", message: `${name} has left the chat.` },
      ]);
    });

    return () => newSocket.disconnect();
  }, []);

  // Request notification permission once
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Emit new user join when name is entered
  useEffect(() => {
    if (socket && userName) {
      socket.emit("new-user-joined", userName);
    }
  }, [socket, userName]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket) {
      socket.emit("send", message);
      setMessages((prev) => [...prev, { user: userName, message }]);
      setMessage("");
    }
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (userName.trim()) {
      setNamePrompted(true);
    }
  };

  if (!namePrompted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-gray-100 p-4">
        <form onSubmit={handleNameSubmit} className="space-y-4">
          <h1 className="text-2xl font-bold">Enter Your Name to Join</h1>
          <Input
            type="text"
            placeholder="Your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="bg-gray-700 border-gray-600 text-gray-100"
          />
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 w-full"
          >
            Join Chat
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 p-4 shadow-md">
        <div className="flex items-center justify-center">
          <Globe className="h-6 w-6 text-blue-400 mr-2" />
          <h1 className="text-xl font-bold">World's Controversy</h1>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4 max-w-2xl mx-auto">
          {messages.map((msg, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 bg-gray-800 p-4 rounded-lg shadow-md transition-all duration-200 hover:bg-gray-700"
            >
              <Avatar>
                <AvatarImage
                  src={`/placeholder.svg?height=40&width=40`}
                  alt={msg.user}
                />
                <AvatarFallback>
                  <User className="h-5 w-5 text-gray-400" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p
                  className={`font-semibold ${
                    msg.user === "System" ? "text-yellow-400" : "text-blue-400"
                  }`}
                >
                  {msg.user}
                </p>
                <p className="text-sm text-gray-300">{msg.message}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form
        onSubmit={handleSendMessage}
        className="p-4 bg-gray-800 border-t border-gray-700"
      >
        <div className="flex space-x-2 max-w-2xl mx-auto">
          <Input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
          />
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
          >
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
