---
layout: post
title: "📖 STM32 LL 库函数速查手册：GPIO · TIM · USART · ADC · DMA · SPI · I2C"
date: 2026-07-15 20:00:00 +0800
categories: ["STM32", "嵌入式开发", "教程"]
tags: ["stm32", "ll-library", "hal", "gpio", "timer", "usart", "adc", "dma", "spi", "i2c", "嵌入式"]
excerpt: "STM32 LL（Low Layer）库常用外设函数速查，涵盖 GPIO、定时器、串口、ADC、DMA、SPI、I2C 及 NVIC，适合 CubeMX 工程下的快速查阅。"
---

> **注意：** LL（Low Layer）函数直接操作外设寄存器，执行效率高，但不同 STM32 系列的函数名和可用功能可能略有差异。以下以 CubeMX 生成的 LL 工程为准。

---

# RCC（时钟配置）

## 配置

> HSE 选择 `Crystal/Ceramic Resonator` 才能在时钟树中使用外部晶振。
> 在 CubeMX 的 Clock Configuration 中配置系统时钟、AHB 和 APB 分频。
> 使用外设前必须使能对应外设时钟；CubeMX 生成的初始化代码通常已经完成这一步。

```c
// 常见时钟使能函数（具体名称随芯片系列变化）
LL_AHB1_GRP1_EnableClock(LL_AHB1_GRP1_PERIPH_GPIOA);
LL_APB1_GRP1_EnableClock(LL_APB1_GRP1_PERIPH_TIM2);
LL_APB2_GRP1_EnableClock(LL_APB2_GRP1_PERIPH_USART1);

// 获取当前时钟频率
LL_RCC_GetSystemClocksFreq(&RCC_Clocks);
// RCC_Clocks.SYSCLK_Frequency
// RCC_Clocks.HCLK_Frequency
// RCC_Clocks.PCLK1_Frequency
// RCC_Clocks.PCLK2_Frequency
```

---

# GPIO

## 配置

> 普通 GPIO 在 CubeMX 中选择输入、输出或复用功能。
> 外部中断选择 `GPIO_EXTIx`，并在 NVIC 中使能对应的 EXTI 中断。
> 推挽输出一般选 `Output Push Pull`；开漏总线（如 I²C）使用 `Open Drain` 并配置上拉。

## GPIO 函数

> `GPIOx` 为引脚组，如 `GPIOA`；`PinMask` 为引脚掩码，如 `LL_GPIO_PIN_5`。

```c
LL_GPIO_SetOutputPin(GPIO_TypeDef *GPIOx, uint32_t PinMask);    // 设置引脚高电平
LL_GPIO_ResetOutputPin(GPIO_TypeDef *GPIOx, uint32_t PinMask);  // 设置引脚低电平
LL_GPIO_TogglePin(GPIO_TypeDef *GPIOx, uint32_t PinMask);       // 翻转输出电平

LL_GPIO_IsInputPinSet(GPIO_TypeDef *GPIOx, uint32_t PinMask);   // 读取输入引脚，返回 0 或 1
LL_GPIO_IsOutputPinSet(GPIO_TypeDef *GPIOx, uint32_t PinMask);  // 读取输出引脚，返回 0 或 1
LL_GPIO_ReadInputPort(GPIO_TypeDef *GPIOx);                     // 读取整个输入端口
LL_GPIO_ReadOutputPort(GPIO_TypeDef *GPIOx);                    // 读取整个输出端口

LL_GPIO_WriteOutputPort(GPIO_TypeDef *GPIOx, uint32_t PortValue); // 写整个输出端口
```

## EXTI 外部中断

```c
// 以 EXTI0 为例；不同系列可能使用 LL_EXTI_LINE_0 或 LL_EXTI_LINE_0_31
if (LL_EXTI_IsActiveFlag_0_31(LL_EXTI_LINE_0))
{
    LL_EXTI_ClearFlag_0_31(LL_EXTI_LINE_0); // 先清除中断标志
    // 用户代码
}
```

---

# TIMER

## 配置

> `PSC` 为预分频值，`ARR` 为自动重装值。
> 计数频率：`f_cnt = f_tim / (PSC + 1)`。
> 更新频率：`f_update = f_tim / ((PSC + 1) × (ARR + 1))`。
> APB 分频不为 1 时，部分系列的定时器时钟为对应 APB 时钟的 2 倍，应以芯片参考手册或 CubeMX 时钟树为准。
> PWM 边沿对齐、向上计数时，占空比约为 `CCR / (ARR + 1)`。

## 基本计数

```c
LL_TIM_EnableCounter(TIM_TypeDef *TIMx);                  // 启动计数器
LL_TIM_DisableCounter(TIM_TypeDef *TIMx);                 // 停止计数器
LL_TIM_SetCounter(TIM_TypeDef *TIMx, uint32_t Counter);   // 设置计数值
LL_TIM_GetCounter(TIM_TypeDef *TIMx);                     // 获取计数值
LL_TIM_SetPrescaler(TIM_TypeDef *TIMx, uint32_t Prescaler); // 设置 PSC
LL_TIM_SetAutoReload(TIM_TypeDef *TIMx, uint32_t AutoReload); // 设置 ARR
LL_TIM_GenerateEvent_UPDATE(TIM_TypeDef *TIMx);           // 立即产生更新事件，装载 PSC/ARR
```

## PWM（输出比较 OC）

```c
LL_TIM_OC_SetCompareCH1(TIM_TypeDef *TIMx, uint32_t CompareValue); // 设置 CH1 比较值
LL_TIM_OC_SetCompareCH2(TIM_TypeDef *TIMx, uint32_t CompareValue); // 设置 CH2 比较值
LL_TIM_OC_SetCompareCH3(TIM_TypeDef *TIMx, uint32_t CompareValue); // 设置 CH3 比较值
LL_TIM_OC_SetCompareCH4(TIM_TypeDef *TIMx, uint32_t CompareValue); // 设置 CH4 比较值

LL_TIM_CC_EnableChannel(TIM_TypeDef *TIMx, LL_TIM_CHANNEL_CH1);    // 使能输出通道
LL_TIM_CC_DisableChannel(TIM_TypeDef *TIMx, LL_TIM_CHANNEL_CH1);   // 禁用输出通道

// TIM1、TIM8 等高级定时器输出 PWM 时还需要使能主输出
LL_TIM_EnableAllOutputs(TIM_TypeDef *TIMx);
```

## 输入捕获（IC）

```c
LL_TIM_IC_GetCaptureCH1(TIM_TypeDef *TIMx); // 获取 CH1 捕获值
LL_TIM_IC_GetCaptureCH2(TIM_TypeDef *TIMx); // 获取 CH2 捕获值
LL_TIM_IC_GetCaptureCH3(TIM_TypeDef *TIMx); // 获取 CH3 捕获值
LL_TIM_IC_GetCaptureCH4(TIM_TypeDef *TIMx); // 获取 CH4 捕获值

LL_TIM_CC_EnableChannel(TIM_TypeDef *TIMx, LL_TIM_CHANNEL_CH1); // 使能捕获通道
```

## 更新中断

```c
LL_TIM_EnableIT_UPDATE(TIM_TypeDef *TIMx);     // 使能更新中断
LL_TIM_DisableIT_UPDATE(TIM_TypeDef *TIMx);    // 禁用更新中断
LL_TIM_IsEnabledIT_UPDATE(TIM_TypeDef *TIMx);  // 判断更新中断是否使能
LL_TIM_IsActiveFlag_UPDATE(TIM_TypeDef *TIMx); // 判断更新标志是否置位
LL_TIM_ClearFlag_UPDATE(TIM_TypeDef *TIMx);    // 清除更新标志

// 中断服务函数中的常用写法
if (LL_TIM_IsActiveFlag_UPDATE(TIMx) && LL_TIM_IsEnabledIT_UPDATE(TIMx))
{
    LL_TIM_ClearFlag_UPDATE(TIMx);
    // 用户代码
}
```

## 输入捕获中断

```c
LL_TIM_EnableIT_CC1(TIM_TypeDef *TIMx);       // 使能 CH1 捕获/比较中断
LL_TIM_IsEnabledIT_CC1(TIM_TypeDef *TIMx);    // 判断 CH1 中断是否使能
LL_TIM_IsActiveFlag_CC1(TIM_TypeDef *TIMx);   // 判断 CH1 标志是否置位
LL_TIM_ClearFlag_CC1(TIM_TypeDef *TIMx);      // 清除 CH1 标志
```

---

# USART / UART

```c
LL_USART_Enable(USART_TypeDef *USARTx);                  // 使能串口
LL_USART_IsActiveFlag_TXE(USART_TypeDef *USARTx);        // 发送数据寄存器是否为空
LL_USART_IsActiveFlag_TC(USART_TypeDef *USARTx);         // 一帧是否发送完成
LL_USART_IsActiveFlag_RXNE(USART_TypeDef *USARTx);       // 是否收到数据

LL_USART_TransmitData8(USART_TypeDef *USARTx, uint8_t Value); // 发送 8 位数据
LL_USART_ReceiveData8(USART_TypeDef *USARTx);                  // 接收 8 位数据

LL_USART_EnableIT_RXNE(USART_TypeDef *USARTx);           // 使能接收非空中断
LL_USART_EnableIT_TXE(USART_TypeDef *USARTx);            // 使能发送空中断
LL_USART_DisableIT_TXE(USART_TypeDef *USARTx);           // 无数据待发时关闭 TXE 中断
```

> 新系列芯片中，`TXE/RXNE` 相关函数可能命名为 `TXE_TXFNF/RXNE_RXFNE`，以对应芯片的 LL 头文件为准。

---

# ADC

```c
LL_ADC_Enable(ADC_TypeDef *ADCx);                         // 使能 ADC
LL_ADC_REG_StartConversion(ADC_TypeDef *ADCx);           // 启动规则组转换
LL_ADC_IsActiveFlag_EOC(ADC_TypeDef *ADCx);               // 单次转换完成标志
LL_ADC_IsActiveFlag_EOS(ADC_TypeDef *ADCx);               // 序列转换完成标志
LL_ADC_REG_ReadConversionData12(ADC_TypeDef *ADCx);       // 读取 12 位转换结果
LL_ADC_ClearFlag_EOC(ADC_TypeDef *ADCx);                  // 清除 EOC（部分系列读取数据后自动清除）
LL_ADC_EnableIT_EOC(ADC_TypeDef *ADCx);                   // 使能转换完成中断
```

> 部分系列在使能 ADC 前需要退出深度掉电、开启稳压器并执行校准，推荐保留 CubeMX 生成的初始化与校准代码。

---

# DMA

```c
LL_DMA_EnableChannel(DMA_TypeDef *DMAx, uint32_t Channel);  // 启动 DMA 通道
LL_DMA_DisableChannel(DMA_TypeDef *DMAx, uint32_t Channel); // 停止 DMA 通道
LL_DMA_SetDataLength(DMA_TypeDef *DMAx, uint32_t Channel,
                     uint32_t NbData);                       // 设置传输数量
LL_DMA_GetDataLength(DMA_TypeDef *DMAx, uint32_t Channel);   // 获取剩余数量

LL_DMA_EnableIT_TC(DMA_TypeDef *DMAx, uint32_t Channel);    // 使能传输完成中断
LL_DMA_EnableIT_HT(DMA_TypeDef *DMAx, uint32_t Channel);    // 使能半传输中断
LL_DMA_EnableIT_TE(DMA_TypeDef *DMAx, uint32_t Channel);    // 使能传输错误中断
```

> DMA 的标志判断和清除函数通常带通道编号，如 `LL_DMA_IsActiveFlag_TC1()`、`LL_DMA_ClearFlag_GI1()`；不同 DMA 架构差异较大，以芯片 LL 头文件为准。

---

# SPI

```c
LL_SPI_Enable(SPI_TypeDef *SPIx);                    // 使能 SPI
LL_SPI_IsActiveFlag_TXE(SPI_TypeDef *SPIx);          // 发送缓冲区为空
LL_SPI_IsActiveFlag_RXNE(SPI_TypeDef *SPIx);         // 接收缓冲区非空
LL_SPI_IsActiveFlag_BSY(SPI_TypeDef *SPIx);          // SPI 正忙
LL_SPI_TransmitData8(SPI_TypeDef *SPIx, uint8_t Data); // 发送 8 位数据
LL_SPI_ReceiveData8(SPI_TypeDef *SPIx);                // 接收 8 位数据
```

> 新系列 SPI 可能使用 FIFO，并提供 `LL_SPI_TransmitData16()` 等接口。片选引脚通常作为普通 GPIO 手动控制。

---

# I2C

```c
LL_I2C_Enable(I2C_TypeDef *I2Cx);                         // 使能 I²C
LL_I2C_IsActiveFlag_TXIS(I2C_TypeDef *I2Cx);              // 可以写入发送数据
LL_I2C_IsActiveFlag_RXNE(I2C_TypeDef *I2Cx);              // 接收数据非空
LL_I2C_IsActiveFlag_TC(I2C_TypeDef *I2Cx);                // 本次传输完成
LL_I2C_IsActiveFlag_STOP(I2C_TypeDef *I2Cx);              // 检测到停止条件
LL_I2C_IsActiveFlag_NACK(I2C_TypeDef *I2Cx);              // 收到 NACK
LL_I2C_TransmitData8(I2C_TypeDef *I2Cx, uint8_t Data);    // 发送 8 位数据
LL_I2C_ReceiveData8(I2C_TypeDef *I2Cx);                   // 接收 8 位数据
LL_I2C_ClearFlag_STOP(I2C_TypeDef *I2Cx);                 // 清除 STOP 标志
LL_I2C_ClearFlag_NACK(I2C_TypeDef *I2Cx);                 // 清除 NACK 标志
```

> STM32 不同系列的 I²C 外设版本差异明显，起始、地址和传输长度的配置方式并不统一，建议直接参考 CubeMX 为目标芯片生成的 LL 示例。

---

# NVIC 中断

```c
NVIC_SetPriority(IRQn, Priority); // 设置中断优先级
NVIC_EnableIRQ(IRQn);             // 使能中断
NVIC_DisableIRQ(IRQn);            // 禁用中断
NVIC_ClearPendingIRQ(IRQn);       // 清除挂起状态
```

> 外设中断生效通常需要同时满足：外设中断源使能、NVIC 对应 IRQ 使能、标志位置位。进入中断服务函数后应及时清除相应标志。

---

> 📝 本文整理自个人学习笔记，与 HAL 库内容互补。推荐对照 CubeMX 生成的 LL 工程阅读，不同 STM32 系列请以芯片对应的 LL 头文件为准。
