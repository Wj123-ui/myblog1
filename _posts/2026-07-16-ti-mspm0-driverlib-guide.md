---
layout: post
title: "📖 TI MSPM0 DriverLib 速查手册：GPIO · Timer · PWM · UART · I2C · SPI · ADC · DAC"
date: 2026-07-16 21:00:00 +0800
categories: ["MSPM0", "嵌入式开发", "教程"]
tags: ["ti", "mspm0", "driverlib", "gpio", "timer", "pwm", "uart", "i2c", "spi", "adc", "dac", "嵌入式"]
excerpt: "TI MSPM0 SDK DriverLib 常用外设函数速查，基于 SysConfig 配置流程，涵盖 GPIO、Timer、PWM、UART、I2C、SPI、ADC12、DAC12 及中断处理。"
---

> **注意：** 本文面向 MSPM0 SDK 的 DriverLib。建议先在 **SysConfig** 中完成外设配置，再调用生成的 `SYSCFG_DL_init()`，业务代码只负责启停、收发和处理中断。
>
> 不同 MSPM0 型号拥有的外设不同，TimerA/TimerG、UART Main/Extend 等 API 也有差异。最终以当前工程的 `ti/driverlib/` 头文件和 SysConfig 生成的 `ti_msp_dl_config.h` 为准。

---

## 通用初始化框架

```c
#include "ti_msp_dl_config.h"

int main(void)
{
    SYSCFG_DL_init();               // 初始化时钟、GPIO 和已配置外设

    NVIC_EnableIRQ(GPIO_MULTIPLE_GPIOA_INT_IRQN); // 仅中断方式需要
    __enable_irq();                 // 全局开中断

    while (1) {
        __WFI();                    // 等待中断，降低空闲功耗
    }
}
```

> `SYSCFG_DL_init()` 通常已经完成复位、上电、时钟和寄存器配置，不要无理由重复调用 `enableClock()` 或重新初始化外设。

---

# 时钟树

在 SysConfig 的 **SYSCTL → Graphical Clock Configuration** 中勾选 **Use Clock Tree**。

重点检查：

- CPUCLK、MCLK、ULPCLK 的频率；
- 外设使用的 BUSCLK、MFCLK 等时钟是否启用；
- 分频后频率能否满足 UART 波特率、Timer 周期和 ADC 采样要求；
- DAC 等外设需要时，是否已经使能 MFCLK。

---

# GPIO 与外部中断

## SysConfig 配置重点

- `Name`：生成到代码中的引脚名称；
- `Direction`：输入或输出；
- `Initial Value`：输出初始电平；
- `Internal Resistor`：上拉、下拉或无上下拉；
- `Drive Strength`：输出驱动能力；
- `Invert`：是否反相；
- `Enable Interrupt`、`Trigger Polarity`：输入中断及触发方式；
- `Assigned Port / Pin`：实际端口和引脚。

模拟引脚与数字功能复用时，应按数据手册要求保持数字 IOMUX 为高阻状态，避免干扰模拟输入。

## 常用函数

```c
DL_GPIO_setPins(GPIOA, DL_GPIO_PIN_0);            // 输出高电平
DL_GPIO_clearPins(GPIOA, DL_GPIO_PIN_0);          // 输出低电平
DL_GPIO_togglePins(GPIOA, DL_GPIO_PIN_0);         // 翻转输出

uint32_t pins = DL_GPIO_readPins(GPIOA, DL_GPIO_PIN_0); // 读取引脚，返回掩码
bool high = (pins & DL_GPIO_PIN_0) != 0;

DL_GPIO_enableInterrupt(GPIOA, DL_GPIO_PIN_0);    // 使能引脚中断
DL_GPIO_disableInterrupt(GPIOA, DL_GPIO_PIN_0);   // 禁用引脚中断
uint32_t status = DL_GPIO_getEnabledInterruptStatus(GPIOA, DL_GPIO_PIN_0);
DL_GPIO_clearInterruptStatus(GPIOA, DL_GPIO_PIN_0);
```

## 中断模板

```c
void GROUP1_IRQHandler(void) // 名称以 ti_msp_dl_config.h 为准
{
    uint32_t status = DL_GPIO_getEnabledInterruptStatus(GPIOA, DL_GPIO_PIN_0);

    if ((status & DL_GPIO_PIN_0) != 0) {
        DL_GPIO_clearInterruptStatus(GPIOA, DL_GPIO_PIN_0);
        // 用户代码
    }
}
```

> 除了外设中断使能，还必须调用 `NVIC_EnableIRQ(..._IRQN)`。IRQ 名称和 ISR 名称直接从 `ti_msp_dl_config.h` 或启动文件复制，不要手写猜测。

---

# Timer（周期定时）

## SysConfig 配置重点

- `Timer Clock Source / Divider / Prescaler`：时钟源与分频；
- `Timer Mode`：向上、向下等计数方式；
- `Desired Timer Period`：期望周期；
- `Actual Timer Period`：实际周期；
- `Start Timer`：初始化后是否自动计数；
- `Enable Interrupts`：周期中断通常选择 `ZERO` 或 `LOAD`，以计数模式为准。

## 常用函数

`Timerx` 中的 `x` 按外设替换为 `A` 或 `G`。

```c
DL_TimerG_startCounter(TIMER_0_INST);               // 开始计数
DL_TimerG_stopCounter(TIMER_0_INST);                // 停止计数
DL_TimerG_setTimerCount(TIMER_0_INST, value);       // 设置当前计数值
uint32_t count = DL_TimerG_getTimerCount(TIMER_0_INST); // 获取当前计数值

DL_TimerG_enableInterrupt(TIMER_0_INST, DL_TIMERG_INTERRUPT_ZERO_EVENT);
DL_TimerG_disableInterrupt(TIMER_0_INST, DL_TIMERG_INTERRUPT_ZERO_EVENT);
```

## 中断模板

```c
void TIMER_0_INST_IRQHandler(void)
{
    switch (DL_TimerG_getPendingInterrupt(TIMER_0_INST)) {
        case DL_TIMERG_IIDX_ZERO:
            // 用户代码
            break;
        default:
            break;
    }
}
```

> `DL_TimerG_getPendingInterrupt()` 返回最高优先级的待处理中断索引，并完成相应的中断确认；通常不需要再用索引值调用 `clearInterruptStatus()`。

---

# PWM

## SysConfig 配置重点

- 选择 PWM Profile；
- 配置计数时钟、PWM 频率和周期计数值；
- 选择 PWM 通道及对应引脚；
- 设置初始电平、比较值和占空比；
- 需要互补输出时，再启用 Complementary Output；
- 用 `Channel Update Mode` 决定比较值何时生效，避免运行中产生毛刺。

## 修改占空比

```c
DL_TimerG_setCaptureCompareValue(
    PWM_0_INST,
    compareValue,
    DL_TIMER_CC_0_INDEX
);
```

边沿对齐 PWM 常用关系：

```
占空比 ≈ Compare / Period × 100%
```

实际极性还受初始电平、PWM 模式和 `Invert Channel` 影响，应以示波器波形为准。

---

# UART

## SysConfig 配置重点

- 波特率、数据位、校验位和停止位；
- 检查 `Calculated Error (%)`；
- 一般关闭硬件流控；
- 中断接收时使能 RX 中断，并开启对应 NVIC IRQ；
- 连续、大批量收发优先考虑 FIFO 或 DMA。

## 轮询收发

```c
DL_UART_Main_transmitData(UART_0_INST, data);          // 直接写发送寄存器
uint8_t data = DL_UART_Main_receiveData(UART_0_INST);  // 直接读接收寄存器

DL_UART_Main_transmitDataBlocking(UART_0_INST, data);  // 等到可发送后写入
uint8_t data2 = DL_UART_Main_receiveDataBlocking(UART_0_INST); // 等到收到数据

bool sent = DL_UART_Main_transmitDataCheck(UART_0_INST, data); // FIFO 满时返回 false
uint8_t rx;
bool received = DL_UART_Main_receiveDataCheck(UART_0_INST, &rx); // FIFO 空时返回 false
```

> `receiveData()` 和 `receiveDataBlocking()` 的返回值才是收到的数据，不传入"接收字节"参数。

## FIFO 与中断

```c
bool rxEmpty = DL_UART_isRXFIFOEmpty(UART_0_INST);
bool txFull  = DL_UART_isTXFIFOFull(UART_0_INST);

uint32_t status = DL_UART_Main_getEnabledInterruptStatus(UART_0_INST);
DL_UART_Main_clearInterruptStatus(UART_0_INST, interruptMask);
```

```c
void UART_0_INST_IRQHandler(void)
{
    switch (DL_UART_Main_getPendingInterrupt(UART_0_INST)) {
        case DL_UART_MAIN_IIDX_RX:
            while (!DL_UART_isRXFIFOEmpty(UART_0_INST)) {
                uint8_t data = DL_UART_Main_receiveData(UART_0_INST);
                // 保存或处理 data
            }
            break;
        default:
            break;
    }
}
```

---

# I²C

## SysConfig 配置重点

- Controller 为主机，Target 为从机；
- 设置总线速度并检查实际速度；
- 一般使用 7 位地址，只有器件明确要求时才启用 10 位地址；
- SDA、SCL 必须开漏并有上拉电阻；
- 复杂传输优先参考 SDK 的 Controller/Target 示例。

## 基本数据寄存器操作

```c
DL_I2C_transmitControllerData(I2C_0_INST, data); // 写入发送数据
uint8_t data = DL_I2C_receiveControllerData(I2C_0_INST); // 读取接收数据

DL_I2C_transmitControllerDataBlocking(I2C_0_INST, data);
uint8_t data2 = DL_I2C_receiveControllerDataBlocking(I2C_0_INST);
```

> 上述函数只处理数据寄存器，不等同于完整的 I²C 事务。一次访问还要正确配置从机地址、传输方向、长度、START、STOP，并处理 NACK 和超时。

典型"写寄存器后读取"流程：

1. 发送 START、从机地址和写方向；
2. 发送寄存器地址；
3. 发送重复 START、从机地址和读方向；
4. 接收数据并发送 STOP；
5. 任一步出现 NACK 或超时都退出并恢复总线。

---

# SPI

## SysConfig 配置重点

- Controller/Peripheral 模式；
- SCLK 频率；
- CPOL、CPHA（SPI Mode 0～3）；
- 帧宽 8/16 位和 MSB/LSB First；
- CS 可由外设控制，也可作为普通 GPIO 手动控制；
- 配置必须与对端器件数据手册完全一致。

## 常用函数

```c
DL_SPI_transmitData8(SPI_0_INST, data);       // 写入 8 位发送数据
uint8_t rx8 = DL_SPI_receiveData8(SPI_0_INST);

DL_SPI_transmitData16(SPI_0_INST, data16);    // 写入 16 位发送数据
uint16_t rx16 = DL_SPI_receiveData16(SPI_0_INST);

DL_SPI_transmitDataBlocking8(SPI_0_INST, data);
uint8_t rx = DL_SPI_receiveDataBlocking8(SPI_0_INST);

while (DL_SPI_isBusy(SPI_0_INST)) {
    // 等待移位寄存器和总线真正空闲，再释放片选
}
```

> SPI 是全双工总线：发送时也会收到数据，接收时需要发送 dummy byte 产生时钟。不要把实例名写成 `UART_0_INST`。

---

# ADC12

## SysConfig 配置重点

- ADC 时钟源、分频和采样时钟；
- 单次、序列或重复转换；
- 软件触发或事件触发；
- 转换数据格式；
- Memory Control 的输入通道、参考电压和采样时间；
- 多通道采样时明确起始 Memory Index 和结束通道；
- 高频连续采样优先使用 DMA。

## 常用函数

```c
DL_ADC12_startConversion(ADC12_0_INST);       // 软件触发转换
DL_ADC12_disableConversions(ADC12_0_INST);    // 停止/禁止转换

uint16_t value = DL_ADC12_getMemResult(
    ADC12_0_INST,
    DL_ADC12_MEM_IDX_0
);
```

电压换算（单端、无增益时）：

```
Vin ≈ ADC值 / (2^N - 1) × Vref
```

其中 `N` 为有效分辨率。实际精度还受参考电压、采样时间、源阻抗和校准影响。

---

# DAC12

使用 DAC 前确认时钟树中已启用所需时钟（常见为 MFCLK），并在 SysConfig 中使能 DAC 输出引脚。

```c
DL_DAC12_output12(DAC0, dataValue); // 12 位输出，范围 0～4095
```

理想输出关系：

```
Vout ≈ dataValue / 4095 × (VREF+ - VREF-) + VREF-
```

---

# 云台常用 TimerA 操作

```c
DL_TimerA_setLoadValue(TIMA0, periodValue); // 修改 PWM 周期/装载值
DL_TimerA_startCounter(TIMA0);              // 开始连续输出 PWM
DL_TimerA_stopCounter(TIMA0);               // 停止 PWM
DL_TimerA_setRepeatCounter(TIMA0, count);    // 设置重复计数
```

> PID 控制通常只需周期性更新 PWM 比较值，不应反复初始化定时器。比较值必须限制在合法周期范围内，防止溢出或占空比异常。

---

# 常见排错顺序

1. 确认程序调用了 `SYSCFG_DL_init()`；
2. 检查 SysConfig 生成的实例名、引脚和 IRQ 名称；
3. 检查外设时钟及复位状态；
4. 中断方式检查"外设中断源 + NVIC + 全局中断"三层使能；
5. 进入 ISR 后读取 pending interrupt 或及时清标志；
6. 通信外设先核对引脚复用、电平、波特率/时序和对端参数；
7. 用逻辑分析仪或示波器确认实际波形，不只看程序变量；
8. API 不确定时，跳转到声明处查看函数原型，不凭名称猜参数。

---

## 官方资料

- [MSPM0 DriverLib 总览](https://software-dl.ti.com/msp430/esd/MSPM0-SDK/latest/docs/english/driverlib/Driverlib_Overview.html)
- [MSPM0 SDK 示例索引](https://software-dl.ti.com/msp430/esd/MSPM0-SDK/latest/docs/english/sdk_users_guide/doc_guide/doc_guide-srcs/examples_guide.html)
