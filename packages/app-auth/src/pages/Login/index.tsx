import { FC, useState } from 'react';
import {
  Avatar,
  Button,
  Col,
  Divider,
  Form,
  Image,
  Input,
  Row,
  Tooltip,
} from 'antd';
import { useIntl, getLocale } from 'umi';
import './index.less';
import { setLocale } from '@@/plugin-locale';
import {
  GithubFilled,
  GooglePlusOutlined,
  QqCircleFilled,
  WechatFilled,
} from '@ant-design/icons';

const prefixCls = 'login-container';
const { Item } = Form;

// 登陆模块
const Login: FC = () => {
  const intl = useIntl();
  const [headerTitle, setHeaderTitle] = useState(
    intl.formatMessage({ id: 'login' }),
  );
  // TODO：继续开发，实现多语言配置化
  return (
    <div className={`${prefixCls}`}>
      <div className={`${prefixCls}-left`}>
        <Image
          preview={false}
          src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png"
          rootClassName={`${prefixCls}-left-image`}
          alt=""
        />
      </div>
      <div className={`${prefixCls}-right`}>
        <div className={`${prefixCls}-right-box`}>
          <h2>{headerTitle}</h2>
          <Form labelAlign="left" colon={false} labelCol={{ span: 3 }}>
            <Item
              label={intl.formatMessage({ id: 'username' })}
              name="username"
            >
              <Input
                placeholder={intl.formatMessage({ id: 'placeholderUsername' })}
              />
            </Item>
            <Item
              label={intl.formatMessage({ id: 'password' })}
              name="password"
            >
              <Input.Password
                placeholder={intl.formatMessage({ id: 'placeholderPassword' })}
              />
            </Item>
            <Item
              label={intl.formatMessage({ id: 'verifyCode' })}
              name="verifyCode"
            >
              <Row gutter={12}>
                <Col span={16}>
                  <Input
                    placeholder={intl.formatMessage({
                      id: 'placeholderVerifyCode',
                    })}
                  />
                </Col>
                <Col span={8}>
                  <Input placeholder="请输入验证码" />
                </Col>
              </Row>
            </Item>
            <Item>
              <Button block type="primary">
                {intl.formatMessage({ id: 'login' })}
              </Button>
            </Item>
            <Item>
              <div className={`register-btn`}>
                <Button type="text" danger>
                  {intl.formatMessage({ id: 'register' })}
                </Button>
              </div>
            </Item>
            <Divider plain>
              <h4>{intl.formatMessage({ id: 'otherWaysToLogIn' })}</h4>
            </Divider>
            <Item>
              <Row justify="space-between">
                <Col span={6}>
                  <Tooltip title={intl.formatMessage({ id: 'wechat' })}>
                    <div className={`other-login-mode`}>
                      <WechatFilled style={{ fontSize: '22px' }} />
                    </div>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title={intl.formatMessage({ id: 'github' })}>
                    <div className={`other-login-mode`}>
                      <GithubFilled style={{ fontSize: '22px' }} />
                    </div>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title={intl.formatMessage({ id: 'qq' })}>
                    <div className={`other-login-mode`}>
                      <QqCircleFilled style={{ fontSize: '22px' }} />
                    </div>
                  </Tooltip>
                </Col>
                <Col span={6}>
                  <Tooltip title={intl.formatMessage({ id: 'google' })}>
                    <div className={`other-login-mode`}>
                      <GooglePlusOutlined style={{ fontSize: '22px' }} />
                    </div>
                  </Tooltip>
                </Col>
              </Row>
            </Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Login;