import React from "react";
import { H1, Text } from "@/components/Typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <H1>О нас</H1>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/3 space-y-4">
              <Text className="text-lg font-medium">
                MILA ERP — современная система управления складом и ресурсами
                предприятия, разработанная с учетом потребностей малого и
                среднего бизнеса.
              </Text>

              <Text>
                Основанная в 2023 году, наша компания ставит перед собой цель
                сделать управление товарными запасами простым, эффективным и
                доступным для всех. Мы объединили лучшие практики складского
                учета с современными технологиями, создав интуитивно понятное
                решение, которое экономит время и ресурсы.
              </Text>

              <Text>
                Наша система позволяет легко отслеживать движение товаров,
                управлять запасами, анализировать данные и оптимизировать
                бизнес-процессы. Мы постоянно развиваемся и совершенствуем наш
                продукт, прислушиваясь к отзывам пользователей и следуя
                современным тенденциям в области управления ресурсами
                предприятия.
              </Text>
            </div>

            <div className="md:w-1/3 flex justify-center">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-primary-100 rounded-full"></div>
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                  <div className="text-4xl font-bold text-primary-600">
                    MILA ERP
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Наша миссия</CardTitle>
        </CardHeader>
        <CardContent>
          <Text>
            Наша миссия — сделать управление складскими и товарными запасами
            доступным, эффективным и понятным для компаний любого размера. Мы
            стремимся помочь предприятиям оптимизировать свои бизнес-процессы,
            сократить расходы и принимать обоснованные решения на основе данных.
          </Text>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Преимущества MILA ERP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Интуитивный интерфейс</h3>
              <Text>
                Простой и понятный интерфейс позволяет быстро освоить систему
                без длительного обучения. Навигация и основные функции доступны
                с главного экрана.
              </Text>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">
                Гибкость и масштабируемость
              </h3>
              <Text>
                Система адаптируется под потребности вашего бизнеса и может
                расти вместе с вашей компанией. Добавляйте новые функции по мере
                необходимости.
              </Text>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Работа с штрихкодами</h3>
              <Text>
                Встроенный сканер штрихкодов позволяет быстро идентифицировать
                товары, упрощая учет и сокращая количество ошибок.
              </Text>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Управление коробками</h3>
              <Text>
                Эффективное управление упаковкой и перемещением товаров в
                коробках повышает организацию склада и ускоряет логистические
                процессы.
              </Text>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Контактная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-medium">Адрес:</div>
                <Text>г. Москва, ул. Примерная, д. 123, офис 456</Text>
              </div>

              <div className="space-y-2">
                <div className="font-medium">График работы:</div>
                <Text>
                  Пн-Пт: 9:00 - 18:00
                  <br />
                  Сб-Вс: Выходной
                </Text>
              </div>

              <div className="space-y-2">
                <div className="font-medium">Телефон:</div>
                <Text>+7 (495) 123-45-67</Text>
              </div>

              <div className="space-y-2">
                <div className="font-medium">Email:</div>
                <Text>info@mila-erp.com</Text>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
