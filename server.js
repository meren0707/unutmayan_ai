require('dotenv').config();

const express = require('express');

const cors = require('cors');

const path = require('path');



const app = express();

app.use(cors());

app.use(express.json({ limit: '50mb' })); // Büyük context verileri için limit yükseltildi

app.use(express.static(path.join(__dirname, 'public')));



// Sohbet geçmişini saklayan bellek (İsteğe göre bir veritabanına kaydedilebilir)

let conversationHistory = [

  {

      role: "system",

          content: "Sen 1 milyon token bağlam hafızasına sahip, kullanıcının gönderdiği hiçbir şeyi unutmayan yardımsever bir AI asistansın."

            }

            ];



            app.post('/api/chat', async (req, res) => {

              const { message } = req.body;



                if (!message) {

                    return res.status(400).json({ error: "Mesaj boş olamaz." });

                      }



                        // Yeni mesajı geçmişe ekle

                          conversationHistory.push({ role: "user", content: message });



                            try {

                                const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {

                                      method: "POST",

                                            headers: {

                                                    "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,

                                                            "Content-Type": "application/json",

                                                                    "Accept": "application/json"

                                                                          },

                                                                                body: JSON.stringify({

                                                                                        model: "z-ai/glm-4-flash", // NVIDIA Build endpoint modeli

                                                                                                messages: conversationHistory,

                                                                                                        temperature: 0.7,

                                                                                                                top_p: 1,

                                                                                                                        max_tokens: 4096,

                                                                                                                                stream: false

                                                                                                                                      })

                                                                                                                                          });



                                                                                                                                              if (!response.ok) {

                                                                                                                                                    const errText = await response.text();

                                                                                                                                                          throw new Error(`NVIDIA API Hatası: ${response.status} - ${errText}`);

                                                                                                                                                              }



                                                                                                                                                                  const data = await response.json();

                                                                                                                                                                      const assistantMessage = data.choices[0].message.content;



                                                                                                                                                                          // Asistan cevabını da geçmişe ekle (Böylece 1M token hafıza korunur)

                                                                                                                                                                              conversationHistory.push({ role: "assistant", content: assistantMessage });



                                                                                                                                                                                  res.json({ reply: assistantMessage, historyLength: conversationHistory.length });

                                                                                                                                                                                    } catch (error) {

                                                                                                                                                                                        console.error("Hata:", error);

                                                                                                                                                                                            res.status(500).json({ error: "Model yanıt oluştururken bir sorun oluştu." });

                                                                                                                                                                                              }

                                                                                                                                                                                              });



                                                                                                                                                                                              // Hafızayı sıfırlamak için opsiyonel endpoint

                                                                                                                                                                                              app.post('/api/reset', (req, res) => {

                                                                                                                                                                                                conversationHistory = [

                                                                                                                                                                                                    {

                                                                                                                                                                                                          role: "system",

                                                                                                                                                                                                                content: "Sen 1 milyon token bağlam hafızasına sahip, kullanıcının gönderdiği hiçbir şeyi unutmayan yardımsever bir AI asistansın."

                                                                                                                                                                                                                    }

                                                                                                                                                                                                                      ];

                                                                                                                                                                                                                        res.json({ status: "Hafıza sıfırlandı." });

                                                                                                                                                                                                                        });



                                                                                                                                                                                                                        const PORT = process.env.PORT || 3000;

                                                                                                                                                                                                                        app.listen(PORT, () => {

                                                                                                                                                                                                                          console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);

                                                                                                                                                                                                                          });