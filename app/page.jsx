"use client";
import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    const newSocket = io("http://192.168.100.22:8000");
    setSocket(newSocket);

    const notificationSound = new Audio("/sounds/notification.MP3");

    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    newSocket.on("connect", () => {
      const name = prompt("Enter Your Name To Join");
      if (name) {
        setUserName(name);
        newSocket.emit("new-user-joined", name);
      }
    });

    newSocket.on("user-joined", (name) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { user: "System", message: `${name} has joined the chat!` },
      ]);
    });

    newSocket.on("receive", (data) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { user: data.name, message: data.message },
      ]);

      notificationSound.play();

      if (Notification.permission === "granted") {
        new Notification(data.name, { body: data.message });
      }
    });

    newSocket.on("user-left", (name) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { user: "System", message: `${name} has left the chat.` },
      ]);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket.IO connection closed");
    });

    return () => newSocket.close();
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket) {
      socket.emit("send", message);

      setMessages((prevMessages) => [
        ...prevMessages,
        { user: userName, message: message },
      ]);

      setMessage("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 p-4 shadow-md">
        <div className="flex items-center justify-center">
          <Globe className="h-6 w-6 text-blue-400 mr-2" />
          <h1 className="text-xl font-bold">World's Controversy</h1>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
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
