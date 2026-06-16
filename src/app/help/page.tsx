import React from "react";
import { H1, Text } from "@/components/Typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <H1>Центр помощи</H1>

      <Card>
        <CardHeader>
          <CardTitle>Часто задаваемые вопросы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Как добавить новый товар?</h3>
            <Text>
              Чтобы добавить новый товар, перейдите на вкладку "Добавить товар"
              в верхнем меню. Заполните все необходимые поля формы: название
              товара, описание, цену, категорию и другие доступные параметры. Вы
              также можете загрузить фотографии товара. После заполнения всех
              полей нажмите кнопку "Сохранить".
            </Text>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-lg">
              Как отсканировать штрихкод товара?
            </h3>
            <Text>
              Для сканирования штрихкода перейдите на вкладку "Сканировать
              штрихкод". Предоставьте доступ к камере, когда браузер запросит
              разрешение. Наведите камеру на штрихкод товара. Система
              автоматически распознает код и отобразит информацию о товаре, если
              он уже есть в базе данных.
            </Text>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Как управлять коробками?</h3>
            <Text>
              Для управления коробками перейдите на вкладку "Управление
              коробками". Здесь вы можете просматривать список всех коробок,
              создавать новые, редактировать существующие или удалять их. Чтобы
              добавить товары в коробку, выберите нужную коробку и нажмите
              "Добавить товары".
            </Text>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-lg">
              Как найти товар в системе?
            </h3>
            <Text>
              Для поиска товара перейдите на вкладку "Список товаров". В верхней
              части страницы находится строка поиска. Введите название товара,
              его артикул или другие ключевые параметры. Система отобразит все
              товары, соответствующие вашему запросу.
            </Text>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Техническая поддержка</CardTitle>
        </CardHeader>
        <CardContent>
          <Text>
            Если у вас возникли вопросы или проблемы при использовании MILA ERP,
            пожалуйста, свяжитесь с нашей службой поддержки:
          </Text>
          <div className="mt-4 space-y-2">
            <div className="flex items-center">
              <span className="font-medium min-w-32">Email:</span>
              <span>support@mila-erp.com</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium min-w-32">Телефон:</span>
              <span>+7 (495) 123-45-67</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium min-w-32">Рабочие часы:</span>
              <span>Пн-Пт с 9:00 до 18:00 (МСК)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
