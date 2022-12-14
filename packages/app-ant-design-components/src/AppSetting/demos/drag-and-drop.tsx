import { ConfigProvider, Form } from 'antd';
import { AppSetting, AppSettingForm } from 'app-ant-design-components';
import React, { useState } from 'react';

/**
 * 跟随主题色改变的demo
 * @constructor
 */
export default () => {
  const [loadingState, setLoadingState] = useState(false);
  const [appSettingForm] = Form.useForm<{ settingTitle: string }>();
  const handleSubmit = (data: any) => {
    console.log('e', data);
    setLoadingState(true);
    console.log(
      'data ==>',
      appSettingForm.getFieldsValue([
        'systemTitle',
        'systemIcon',
        'systemSupportLanguage',
        'systemThemeColor',
        'systemNavigationBarPreferences',
        'systemSidebarPreferences',
      ]),
    );
  };
  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#e82b2b' } }}>
      <AppSetting
        loading={loadingState}
        onSubmit={handleSubmit}
        colorPrimary="#e82b2b"
      >
        <AppSettingForm form={appSettingForm} onFinish={handleSubmit} />
      </AppSetting>
    </ConfigProvider>
  );
};
