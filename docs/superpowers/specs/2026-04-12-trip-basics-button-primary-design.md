# 基础信息区“生成行程安排表”按钮主色化设计

## 背景

当前 `src/components/visa-form/trip-basics-section.tsx` 中的“生成行程安排表”按钮使用 `outline` 样式：

- 视觉权重偏轻。
- 在当前页面已经整体紧凑化之后，这个按钮作为基础信息区的主要动作，层级不够突出。

用户希望将这个按钮改为更深色的效果，并已确认采用“沿用项目默认主色”的方案。

## 目标

- 让“生成行程安排表”按钮成为基础信息区更明确的主操作。
- 复用项目现有按钮系统，不新增局部特化样式。
- 不改按钮文案、尺寸、点击逻辑和交互行为。

## 非目标

- 不修改其他按钮颜色。
- 不新增按钮 variant。
- 不修改 `onAutoBuildDays` 的行为。
- 不调整基础信息区的结构和字段顺序。

## 采用方案

采用“切换到项目默认主按钮样式”的方案。

具体方式：

- 保留 `Button` 组件。
- 去掉该按钮上的 `variant="outline"`。
- 保留现有尺寸类，例如 `h-9 px-3 text-sm`，只改变视觉样式来源。

## 选择理由

- `src/components/ui/button.tsx` 中默认按钮样式已经定义为 `bg-primary text-primary-foreground hover:bg-primary/90`。
- 该方案与项目现有设计系统完全一致，维护成本最低。
- 相比手动写深灰或新增 variant，这次只改一个按钮时更简单、更稳定。

## 影响范围

仅修改：

- `src/components/visa-form/trip-basics-section.tsx`

不涉及：

- `src/components/ui/button.tsx`
- 其他 tab 按钮
- 页面状态逻辑

## 验收标准

- “生成行程安排表”按钮显示为项目默认主色实心按钮。
- 按钮尺寸和文案保持不变。
- 基础信息区其他控件样式不受影响。
